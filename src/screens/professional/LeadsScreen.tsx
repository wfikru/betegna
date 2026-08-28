import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { LeadCard } from '../../components/cards/LeadCard';
import { FadeIn } from '../../components/common/Motion';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Lead, LeadState, ServiceRequest } from '../../models/types';
import { subscribeLeads, getRequest } from '../../services/requests';
import { LEAD_STATE } from '../../constants/status';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';

const FILTERS: { id: LeadState | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: LEAD_STATE.new.label },
  { id: 'contacted', label: LEAD_STATE.contacted.label },
  { id: 'quoted', label: LEAD_STATE.quoted.label },
  { id: 'won', label: LEAD_STATE.won.label },
];

export default function LeadsScreen() {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [requests, setRequests] = useState<Record<string, ServiceRequest>>({});
  const [filter, setFilter] = useState<LeadState | 'all'>('all');

  useEffect(() => {
    if (!user) return;
    return subscribeLeads(user.uid, setLeads);
  }, [user]);

  useEffect(() => {
    (leads ?? []).forEach((l) => {
      if (!requests[l.requestId]) void getRequest(l.requestId).then((r) => r && setRequests((prev) => ({ ...prev, [r.id]: r })));
    });
  }, [leads, requests]);

  const visible = (leads ?? []).filter((l) => filter === 'all' || l.state === filter);

  return (
    <Screen scroll style={{ paddingBottom: 110 }}>
      <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800' }}>{t('pro.leadFeed')}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 4, marginBottom: 16, lineHeight: 20 }}>
        Real requests from customers near you. Respond fast — pros who quote within an hour win 4× more jobs.
        Match score = service fit + distance + ratings + responsiveness (higher = better fit).
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[
              styles.filter,
              { borderRadius: radius.full, backgroundColor: filter === f.id ? palette.primary : palette.surface, borderColor: filter === f.id ? palette.primary : palette.border },
            ]}
          >
            <Text style={{ color: filter === f.id ? palette.onPrimary : palette.text, fontSize: 13, fontWeight: '700' }}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {leads === null ? (
        <SkeletonList rows={3} />
      ) : visible.length ? (
        visible.map((l, i) => (
          <FadeIn key={l.id} delay={i * 70}>
            <LeadCard lead={l} request={requests[l.requestId]} onPress={() => navigation.navigate('LeadDetail', { leadId: l.id })} />
          </FadeIn>
        ))
      ) : (
        <EmptyState
          icon="flash-outline"
          title={t('pro.leadEmpty')}
          message="Meanwhile: complete your profile, add portfolio photos and keep working hours open — matched requests land here instantly."
          action={<Button label="Improve my profile" variant="secondary" onPress={() => navigation.navigate('ProProfileEdit')} icon="trending-up" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filter: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
});
