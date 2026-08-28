import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { BottomSheet } from '../../components/common/BottomSheet';
import { useToast } from '../../state/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Timeline } from '../../components/booking/Timeline';
import { QuoteCard } from '../../components/cards/QuoteCard';
import { ProCard } from '../../components/cards/ProCard';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { ProfessionalProfile, Quote, ServiceRequest, Booking } from '../../models/types';
import { cancelRequest, getRequest, subscribeRequests } from '../../services/requests';
import { subscribeBookings } from '../../services/bookings';
import { subscribeQuotesForRequest, acceptQuote, setQuoteStatus } from '../../services/quotes';
import { getPro } from '../../services/professionals';
import { ensureConversation } from '../../services/chat';
import { getService } from '../../config/seed/taxonomy';
import { money } from '../../utils/format';
import { summarizeServiceAnswers } from '../../features/services/questionnaireEngine';
import { REQUEST_STATUS, URGENCY_LABEL } from '../../constants/status';
import { requestTimeline } from '../../features/requests/lifecycle';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

/** statuses where the customer may still cancel the request */
const ACTIONABLE_STATUSES = ['submitted', 'matching', 'matched', 'quote_received'];
type Tab = 'overview' | 'quotes' | 'pros';

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const requestId = route.params.requestId;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pros, setPros] = useState<Record<string, ProfessionalProfile>>({});
  const [booking, setBooking] = useState<Booking | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [cancelSheet, setCancelSheet] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    return subscribeBookings(user.uid, 'customer', (list) => {
      setBooking(list.find((b) => b.requestId === requestId) ?? null);
    });
  }, [user, requestId]);

  useEffect(() => {
    void getRequest(requestId).then(setRequest);
    return subscribeRequests(user?.uid ?? '', (list) => {
      const found = list.find((r) => r.id === requestId);
      if (found) setRequest(found);
      else void getRequest(requestId).then(setRequest);
    });
  }, [requestId, user]);

  useEffect(() => {
    return subscribeQuotesForRequest(requestId, setQuotes);
  }, [requestId]);

  useEffect(() => {
    const ids = request?.matchedProIds ?? [];
    ids.forEach((id) => {
      if (!pros[id]) void getPro(id).then((p) => p && setPros((prev) => ({ ...prev, [id]: p })));
    });
  }, [request?.matchedProIds, pros]);

  const service = request ? getService(request.serviceId) : undefined;
  const requestOpen = !['booked', 'in_progress', 'completed', 'cancelled'].includes(request?.status ?? '');
  const summaryRows = useMemo(
    () => (service && request ? summarizeServiceAnswers(service, request.answers) : []),
    [service, request],
  );
  const status = request ? REQUEST_STATUS[request.status] : undefined;
  const openQuotes = quotes.filter((q) => q.status === 'sent' && q.expiresAt > Date.now());
  const closed = request?.status === 'cancelled';

  const onAccept = async (quote: Quote) => {
    if (!user) return;
    try {
      const bookingId = await acceptQuote(quote.id, user.name);
      navigation.replace('BookingDetail', { bookingId });
    } catch (e) {
      console.error(e);
    }
  };

  const openChat = async (proId: string) => {
    if (!user || !request) return;
    const conv = await ensureConversation(user, proId, request.id);
    navigation.navigate('ChatThread', { conversationId: conv.id });
  };

  if (!request) {
    return (
      <Screen>
        <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: 120 }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false}>
      {/* header */}
      <View style={[styles.header, { backgroundColor: closed ? palette.surfaceAlt : palette.surface }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 12 }}>
          <Ionicons name="chevron-back" size={24} color={closed ? palette.text : '#fff'} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: palette.text, fontSize: 22, fontWeight: '800' }}>
              {request.serviceName}
            </Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3 }}>
              {request.location.subcity} · {URGENCY_LABEL[request.when.urgency]}
              {request.when.preferredDate ? ` · ${request.when.preferredDate}` : ''}
            </Text>
          </View>
          {status ? <Badge label={status.label} tone={closed ? 'danger' : 'accent'} /> : null}
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {/* tabs */}
        <View style={[styles.tabs, { backgroundColor: palette.surfaceAlt, borderRadius: 12 }]}>
          {(
            [
              ['overview', 'Overview'],
              ['quotes', `Quotes${openQuotes.length ? ` · ${openQuotes.length}` : ''}`],
              ['pros', `Pros · ${request.matchedProIds.length}`],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              style={[styles.tab, { borderRadius: 10, backgroundColor: tab === id ? palette.surface : 'transparent' }]}
            >
              <Text style={{ color: tab === id ? palette.primary : palette.textMuted, fontSize: 13.5, fontWeight: '700' }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'overview' ? (
          <>
            <Section title="Your request" palette={palette}>
              <Text style={{ color: palette.text, fontSize: 14.5, lineHeight: 21 }}>
                {request.summaryText || request.serviceName}
              </Text>
            </Section>

            {summaryRows.length ? (
              <Section title={t('request.answers')} palette={palette}>
                {summaryRows.map((r) => (
                  <View key={r.label} style={styles.answerRow}>
                    <Text style={{ color: palette.textMuted, fontSize: 13, flex: 1 }}>{r.label}</Text>
                    <Text style={{ color: palette.text, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' }}>{r.value}</Text>
                  </View>
                ))}
              </Section>
            ) : null}

            <Section title={t('request.timeline')} palette={palette}>
              <Timeline events={requestTimeline(request)} />
            </Section>

            {booking && ['booked', 'in_progress', 'completed'].includes(request.status) ? (
              <Button
                label={`View booking · ${money(booking.total)}`}
                variant="secondary"
                icon="calendar-outline"
                onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
                style={{ marginBottom: 8 }}
              />
            ) : null}

            {ACTIONABLE_STATUSES.includes(request.status) ? (
              <Button
                label={t('request.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => setCancelSheet(true)}
                style={{ marginTop: 6 }}
              />
            ) : null}
          </>
        ) : null}

        {tab === 'quotes' ? (
          quotes.length ? (
            quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                onAccept={requestOpen ? () => onAccept(q) : undefined}
                onDecline={requestOpen ? () => void setQuoteStatus(q.id, 'declined') : undefined}
                onMessage={() => void openChat(q.proId)}
                onSeeReviews={() => navigation.navigate('ProProfile', { proId: q.proId, requestId: request.id })}
              />
            ))
          ) : (
            <EmptyState icon="pricetag-outline" title={t('quote.empty')} message={t('quote.emptyHint')} />
          )
        ) : null}

        {tab === 'pros' ? (
          request.matchedProIds.length ? (
            request.matchedProIds.map((id) => {
              const pro = pros[id];
              if (!pro) return null;
              return (
                <ProCard
                  key={id}
                  pro={pro}
                  onPress={() => navigation.navigate('ProProfile', { proId: id, requestId: request.id })}
                  secondary={
                    <>
                      <Button label="Chat" variant="secondary" size="sm" onPress={() => void openChat(id)} style={{ flex: 1 }} />
                      <Button label="View" size="sm" onPress={() => navigation.navigate('ProProfile', { proId: id, requestId: request.id })} style={{ flex: 1 }} />
                    </>
                  }
                />
              );
            })
          ) : (
            <EmptyState icon="people-outline" title="No professionals yet" message="We're still scanning for matches in your area." />
          )
        ) : null}
      </View>

      <BottomSheet
        visible={cancelSheet}
        title="Cancel this request?"
        message={`${request.matchedProIds.length} professional${request.matchedProIds.length === 1 ? '' : 's'} already received it and will be notified. This cannot be undone.`}
        confirmLabel="Cancel request"
        destructive
        onClose={() => setCancelSheet(false)}
        onConfirm={() => {
          setCancelSheet(false);
          void cancelRequest(request.id).then(() => toast.show('Request cancelled'));
        }}
      />
    </Screen>
  );
}

function Section({ title, palette, children }: { title: string; palette: ReturnType<typeof useTheme>['palette']; children: React.ReactNode }) {
  const { palette: p } = useTheme();
  void palette;
  return (
    <View style={[sectionStyles.wrap, { borderColor: p.border, backgroundColor: p.surface }]}>
      <Text style={{ color: p.textMuted, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 }}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth * 1.5 },
  tabs: { flexDirection: 'row', padding: 4, marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  answerRow: { flexDirection: 'row', paddingVertical: 5 },
});

const sectionStyles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
});
