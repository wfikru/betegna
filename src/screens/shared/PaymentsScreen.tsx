import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Chip } from '../../components/common/Chip';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import type { PaymentRecord } from '../../models/types';
import { subscribePayments } from '../../services/payments';
import { PAYMENT_STATUS_META } from '../../features/payments/paymentFlow';
import { money, relativeTime } from '../../utils/format';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';

export default function PaymentsScreen() {
  const { palette, radius } = useTheme();
  const { user, activeRole } = useAuth();
  const navigation = useAppNavigation();
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [tab, setTab] = useState<'all' | 'done' | 'pending'>('all');

  useEffect(() => {
    if (!user) return;
    return subscribePayments(user.uid, setPayments);
  }, [user]);

  const isPro = activeRole === 'professional';

  return (
    <Screen scroll>
      <PageHeader title="Money" fallbackTab={isPro ? "DashTab" : "ProfileTab"} />
      <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800' }}>Money</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 4, marginBottom: 18, lineHeight: 20 }}>
        {isPro
          ? 'Released payments count toward your earnings. Telebirr funds are escrowed until each job completes.'
          : 'Every payment you make on Betegna — Telebirr (escrowed) and cash — appears here.'}
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        <Chip label="All" selected={tab === 'all'} onPress={() => setTab('all')} />
        <Chip label={isPro ? 'Received' : 'Paid'} selected={tab === 'done'} onPress={() => setTab('done')} />
        <Chip label="Pending" selected={tab === 'pending'} onPress={() => setTab('pending')} />
      </View>

      {payments === null ? (
        <SkeletonList rows={3} height={70} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon="card-outline"
          title={isPro ? 'No earnings yet' : 'No payments yet'}
          message={isPro ? 'Complete jobs to earn — payments land here the moment they are released.' : 'When you complete and pay for a job, the receipt appears here.'}
        />
      ) : (
        payments
          .filter((p) =>
            tab === 'all' ? true : tab === 'done' ? p.status === 'released' : ['pending', 'processing', 'held'].includes(p.status),
          )
          .map((p) => {
          const meta = PAYMENT_STATUS_META[p.status];
          const incoming = isPro && p.payeeUid === user?.uid;
          return (
            <View
              key={p.id}
              style={[styles.row, { borderRadius: radius.lg, borderColor: palette.border, backgroundColor: palette.surface }]}
            >
              <Text style={{ fontSize: 24 }}>{p.provider === 'telebirr' ? '📱' : '💵'}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>
                  {incoming ? '+' : '−'}
                  {money(incoming ? (p.proNet ?? p.amount) : p.refundAmount ?? p.amount)}{' '}
                  {incoming ? 'received' : p.status === 'refunded' ? 'refunded' : 'paid'}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>
                  {p.provider === 'telebirr' ? 'Telebirr' : 'Cash'} · booking · {relativeTime(p.updatedAt)}
                  {incoming && p.platformFee ? ` · fee ${money(p.platformFee)}` : ''}
                  {p.providerRef ? ` · ${p.providerRef.slice(0, 14)}` : ''}
                </Text>
              </View>
              <Badge label={meta.label} tone={meta.tone} />
            </View>
          );
        })
      )}
      <View style={{ height: 8 }} />
      <Text
        onPress={() => {
          if (isPro) navigation.navigate('ProTabs', { screen: 'ProProfileTab' });
          else navigation.navigate('CustomerTabs', { screen: 'ProfileTab' });
        }}
        style={{ color: palette.primary, fontSize: 13.5, fontWeight: '700', textAlign: 'center', marginTop: 6 }}
      >
        Back to profile
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 14, marginBottom: 10 },
});
