import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Screen } from '../../components/common/Screen';
import { BottomSheet } from '../../components/common/BottomSheet';
import { useToast } from '../../state/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Timeline } from '../../components/booking/Timeline';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Booking, PaymentRecord } from '../../models/types';
import { getBooking, subscribeBookings, cancelBooking, updateBookingStatus } from '../../services/bookings';
import { ensureConversation } from '../../services/chat';
import {
  confirmCashCollected,
  initiatePayment,
  paymentMethodsFor,
  subscribePayments,
} from '../../services/payments';
import { needsPayment, PAYMENT_STATUS_META } from '../../features/payments/paymentFlow';
import { money, formatDate, formatTime } from '../../utils/format';
import { BOOKING_STATUS } from '../../constants/status';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

export default function BookingDetailScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { user, activeRole } = useAuth();
  const isPro = activeRole === 'professional';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [cancelSheet, setCancelSheet] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void getBooking(route.params.bookingId).then(setBooking);
    if (!user) return;
    return subscribeBookings(user.uid, user.activeRole, (list) => {
      const found = list.find((b) => b.id === route.params.bookingId);
      if (found) setBooking(found);
    });
  }, [route.params.bookingId, user]);

  useEffect(() => {
    if (!user) return;
    return subscribePayments(user.uid, (all) =>
      setPayments(all.filter((p) => p.bookingId === route.params.bookingId)),
    );
  }, [route.params.bookingId, user]);

  if (!booking) {
    return (
      <Screen>
        <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: 120 }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  const status = BOOKING_STATUS[booking.status];
  const otherName = isPro ? booking.customerName : booking.proName;
  const activePayment = payments.find((p) => !['failed', 'cancelled', 'refunded'].includes(p.status));

  const openChat = async () => {
    if (!user) return;
    const conv = await ensureConversation(user, booking.proId, booking.requestId);
    navigation.navigate('ChatThread', { conversationId: conv.id });
  };

  const confirmCancel = () => setCancelSheet(true);

  return (
    <Screen scroll padded={false}>
      <View style={[styles.header, { backgroundColor: palette.surface }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: palette.text, fontSize: 21, fontWeight: '800' }}>{booking.serviceName}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3 }}>
              with {otherName} · {booking.subcity}
            </Text>
          </View>
          <Badge label={status.label} tone={booking.status === 'cancelled' ? 'danger' : 'accent'} />
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {/* schedule card */}
        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <View style={styles.schedRow}>
            <Ionicons name="calendar-outline" size={19} color={palette.primary} />
            <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700', marginLeft: 10 }}>
              {booking.scheduledAt ? `${formatDate(booking.scheduledAt.date)} · ${formatTime(booking.scheduledAt.start)}` : 'Schedule TBD'}
            </Text>
          </View>
          <View style={[styles.schedRow, { marginTop: 10 }]}>
            <Ionicons name="cash-outline" size={19} color={palette.primary} />
            <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700', marginLeft: 10, flex: 1 }}>
              {money(booking.total)}
            </Text>
            <Badge
              label={booking.paid ? 'Paid' : needsPayment(booking) ? 'Payment due' : 'Pay after job'}
              tone={booking.paid ? 'success' : needsPayment(booking) ? 'warning' : 'neutral'}
            />
          </View>
          <View style={[styles.schedRow, { marginTop: 10 }]}>
            <Avatar name={otherName} uri={isPro ? undefined : booking.proPhotoURL} size={30} />
            <Text style={{ color: palette.textMuted, fontSize: 13.5, marginLeft: 10, flex: 1 }}>
              {isPro ? 'Customer' : 'Professional'} · contact via chat
            </Text>
            <Pressable onPress={openChat}>
              <Text style={{ color: palette.primary, fontSize: 13.5, fontWeight: '800' }}>Message →</Text>
            </Pressable>
          </View>
        </View>

        {/* ── payment section (provider-agnostic) ── */}
        <PaymentSection booking={booking} payments={payments} activePayment={activePayment} />

        {/* timeline */}
        <Text style={{ color: palette.text, fontSize: 16.5, fontWeight: '800', marginTop: 18, marginBottom: 12 }}>
          {t('request.timeline')}
        </Text>
        <Timeline events={booking.timeline} />

        {/* actions */}
        {booking.status === 'confirmed' ? (
          isPro ? (
            <Button label="Start job" onPress={() => void updateBookingStatus(booking.id, 'in_progress', 'Professional started the job')} icon="play-outline" size="lg" />
          ) : (
            <Button label={t('booking.cancelBooking')} variant="ghost" onPress={confirmCancel} />
          )
        ) : null}

        {booking.status === 'in_progress' ? (
          isPro ? (
            <Button
              label={t('pro.complete')}
              onPress={() => void updateBookingStatus(booking.id, 'completed', 'Work completed')}
              icon="checkmark-circle-outline"
              size="lg"
            />
          ) : (
            <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <Text style={{ color: palette.textMuted, fontSize: 13.5, lineHeight: 19 }}>
                {otherName.split(' ')[0]} is on the job. When it's done you can pay by Telebirr or cash and leave a review.
              </Text>
            </View>
          )
        ) : null}

        {booking.status === 'completed' && !booking.reviewed && !isPro ? (
          <Button
            label={t('booking.leaveReview')}
            onPress={() => navigation.navigate('ReviewComposer', { bookingId: booking.id, proId: booking.proId, proName: booking.proName })}
            icon="star-outline"
            size="lg"
          />
        ) : null}

        {booking.status === 'cancelled' ? (
          <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Text style={{ color: palette.textMuted, fontSize: 13.5 }}>This booking was cancelled. Need it done anyway? Post the request again — quotes are free.</Text>
          </View>
        ) : null}

        <View style={{ height: 12 }} />
      </View>

      <BottomSheet
        visible={cancelSheet}
        title="Cancel this booking?"
        message="The other party will be notified. Cancellations close to the start time may include a fee."
        confirmLabel="Cancel booking"
        destructive
        onClose={() => setCancelSheet(false)}
        onConfirm={() => {
          setCancelSheet(false);
          void cancelBooking(booking.id).then(() => toast.show('Booking cancelled', 'danger'));
        }}
      />
    </Screen>
  );
}

function PaymentSection({
  booking,
  payments,
  activePayment,
}: {
  booking: Booking;
  payments: PaymentRecord[];
  activePayment?: PaymentRecord;
}) {
  const { palette, radius } = useTheme();
  const { user, activeRole } = useAuth();
  const isPro = activeRole === 'professional';
  const methods = useMemo(() => (user ? paymentMethodsFor(booking) : []), [booking, user]);
  const [busyProvider, setBusyProvider] = useState<string>();
  const toast = useToast();

  const pay = async (providerId: string) => {
    if (!user) return;
    setBusyProvider(providerId);
    try {
      const { redirectUrl } = await initiatePayment(user, booking, providerId);
      if (redirectUrl) await Linking.openURL(redirectUrl).catch(() => undefined);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Could not start payment', 'danger');
    } finally {
      setBusyProvider(undefined);
    }
  };

  const confirmCash = async () => {
    if (!user || !activePayment) return;
    try {
      await confirmCashCollected(user, activePayment);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Could not confirm', 'danger');
    }
  };

  // refund receipt (cancellation settlement)
  const refunded = payments.find((p) => p.status === 'refunded');
  if (refunded) {
    return (
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface, marginTop: 14 }]}>
        <View style={styles.schedRow}>
          <Ionicons name="arrow-undo" size={19} color={palette.info} />
          <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', marginLeft: 10, flex: 1 }}>
            {refunded.provider === 'telebirr' ? '📱 Telebirr' : '💵 Cash'} · refund
          </Text>
          <Badge label="Refunded" tone="neutral" />
        </View>
        <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 8, lineHeight: 18 }}>
          {(refunded.refundAmount ?? refunded.amount).toLocaleString()} ETB returned to your Telebirr
          {refunded.proAmount ? ` · ${refunded.proAmount.toLocaleString()} ETB late-cancellation fee to the professional` : ''}.
        </Text>
      </View>
    );
  }

  // nothing to render when settled or nothing pending
  if (activePayment && ['processing', 'held', 'released'].includes(activePayment.status)) {
    const meta = PAYMENT_STATUS_META[activePayment.status];
    return (
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface, marginTop: 14 }]}>
        <View style={styles.schedRow}>
          <Ionicons
            name={activePayment.status === 'released' ? 'checkmark-circle' : 'lock-closed'}
            size={19}
            color={activePayment.status === 'released' ? palette.success : palette.info}
          />
          <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', marginLeft: 10, flex: 1 }}>
            {activePayment.provider === 'telebirr' ? '📱 Telebirr' : '💵 Cash'} · {money(activePayment.amount)}
          </Text>
          <Badge label={meta.label} tone={meta.tone} />
        </View>
        {activePayment.status === 'held' ? (
          <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 8, lineHeight: 18 }}>
            🔒 Held securely by Betegna. Released to the professional when the job is completed.
          </Text>
        ) : null}
        {activePayment.status === 'processing' ? (
          <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 8, lineHeight: 18 }}>
            Confirming with Telebirr… this usually takes a few seconds.
          </Text>
        ) : null}
      </View>
    );
  }

  // customer chose cash → waiting on the professional's confirmation (no method flipping)
  if (!isPro && activePayment?.provider === 'cash' && ['pending', 'released'].includes(activePayment.status)) {
    const meta = PAYMENT_STATUS_META[activePayment.status];
    return (
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface, marginTop: 14 }]}>
        <View style={styles.schedRow}>
          <Ionicons name="cash-outline" size={19} color={palette.success} />
          <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', marginLeft: 10, flex: 1 }}>
            💵 Cash · {money(activePayment.amount)}
          </Text>
          <Badge label={meta.label} tone={meta.tone} />
        </View>
        <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 8, lineHeight: 18 }}>
          {activePayment.status === 'released'
            ? 'Confirmed received by the professional — payment complete. 🎉'
            : 'Pay the professional in cash when the job is done. They confirm receipt in the app and your booking is marked paid.'}
        </Text>
      </View>
    );
  }

  // customer picks a payment method once work is done/in progress
  if (!isPro && methods.length > 0) {
    return (
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface, marginTop: 14 }]}>
        <Text style={{ color: palette.text, fontSize: 15.5, fontWeight: '800' }}>{t('booking.payment')}</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 3, marginBottom: 12, lineHeight: 18 }}>
          Pay your professional in cash when the job is done — they confirm receipt in the app and your booking is marked paid.
        </Text>
        <View style={{ gap: 10 }}>
          {methods.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => void pay(m.id)}
              disabled={busyProvider !== undefined}
              style={({ pressed }) => [
                styles.methodRow,
                {
                  borderRadius: radius.md,
                  borderColor: activePayment?.provider === m.id ? palette.primary : palette.border,
                  backgroundColor: activePayment?.provider === m.id ? palette.primarySoft : palette.surface,
                  opacity: busyProvider && busyProvider !== m.id ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pay with ${m.label}`}
            >
              <Text style={{ fontSize: 22 }}>{m.icon}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>
                  {m.label} {m.labelAm ? `· ${m.labelAm}` : ''}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 }}>{m.description}</Text>
              </View>
              {busyProvider === m.id ? (
                <Text style={{ color: palette.primary, fontSize: 12.5, fontWeight: '700' }}>Starting…</Text>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // pro side: confirm cash collection after completion
  if (isPro && activePayment?.provider === 'cash' && activePayment.status === 'pending' && booking.status === 'completed') {
    return (
      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface, marginTop: 14 }]}>
        <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700', flex: 1 }}>
          Confirm you received {money(activePayment.amount)} in cash
        </Text>
        <View style={{ height: 10 }} />
        <Button label="Confirm cash received" onPress={() => void confirmCash()} icon="cash-outline" />
      </View>
    );
  }

  void payments;
  return null;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth * 1.5 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
  schedRow: { flexDirection: 'row', alignItems: 'center' },
  methodRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, padding: 14 },
});
