import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Card } from '../../components/common/Card';
import { GradientPanel } from '../../components/common/GradientPanel';
import { TABULAR } from '../../config/theme';
import { useCountUp } from '../../components/common/Motion';
import { profileStrength } from '../../features/reviews/reputation';
import { SectionHeader } from '../../components/common/SectionHeader';
import { LeadCard } from '../../components/cards/LeadCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Booking, Lead, ServiceRequest } from '../../models/types';
import { subscribeLeads, getRequest } from '../../services/requests';
import { subscribeBookings } from '../../services/bookings';
import { getPro, subscribePro } from '../../services/professionals';
import { proEarningsThisMonth } from '../../services/payments';
import { money, formatDate, formatTime, relativeDate } from '../../utils/format';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';

export default function ProDashboardScreen() {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Record<string, ServiceRequest>>({});
  const [earnings, setEarnings] = useState(0);
  const [profileMissing, setProfileMissing] = useState(false);
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubLeads = subscribeLeads(user.uid, setLeads);
    const unsubJobs = subscribeBookings(user.uid, 'professional', setJobs);
    // LIVE: re-checks whenever the profile is created/updated (e.g. onboarding
    // activation while this dashboard stays mounted — no role change, no remount)
    const unsubPro = subscribePro(user.uid, (p) => {
      if (!p) setProfileMissing(true);
      else {
        setProfileMissing(false);
        setStrength(profileStrength(p));
      }
    });
    void proEarningsThisMonth(user.uid).then(setEarnings);
    return () => {
      unsubLeads();
      unsubJobs();
      unsubPro();
    };
  }, [user]);

  useEffect(() => {
    (leads ?? []).forEach((l) => {
      if (!requests[l.requestId]) void getRequest(l.requestId).then((r) => r && setRequests((prev) => ({ ...prev, [r.id]: r })));
    });
  }, [leads, requests]);

  const animatedEarnings = useCountUp(earnings);
  const newLeads = (leads ?? []).filter((l) => l.state === 'new');
  const activeJobs = jobs.filter((j) => ['confirmed', 'in_progress', 'rescheduled'].includes(j.status));
  const todayJobs = activeJobs.filter((j) => j.scheduledAt?.date === new Date().toISOString().slice(0, 10));

  if (profileMissing) {
    return (
      <Screen scroll style={{ paddingBottom: 110 }}>
        <EmptyState
          icon="briefcase-outline"
          title="Set up your professional profile"
          message="Add your services, prices and service area to start receiving matched leads."
          action={<Button label="Start setup" onPress={() => navigation.navigate('ProOnboarding')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <GradientPanel style={[styles.hero]} bottomRadius={28} colors={['#0C724C', '#0A5C3E']}>
        <Text style={styles.heroLabel}>{t('pro.dashboard').toUpperCase()} · PRO MODE</Text>
        <Text style={[styles.heroEarnings, TABULAR]}>{money(animatedEarnings)}</Text>
        <Text style={styles.heroCaption}>{t('pro.earnings')}</Text>
      </GradientPanel>

      <View style={styles.statsRow}>
        <Stat label={t('pro.newLeads')} value={String(newLeads.length)} icon="flash" tone="accent" onPress={() => navigation.navigate('LeadsTab')} />
        <Stat label={t('pro.activeJobs')} value={String(activeJobs.length)} icon="calendar" tone="info" onPress={() => navigation.navigate('CalendarTab')} />
      </View>

      {/* next best action when things are quiet */}
      {newLeads.length === 0 && activeJobs.length === 0 ? (
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="bulb-outline" size={17} color={palette.accent} />
            <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '800', marginLeft: 8, flex: 1 }}>
              Get your first leads
            </Text>
          </View>
          {strength < 100 ? (
            <Button label={`Complete your profile · ${strength}%`} variant="secondary" size="sm" icon="trending-up" onPress={() => navigation.navigate('ProProfileEdit')} />
          ) : (
            <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 19 }}>
              You're all set up. Pros with photos, fast replies and open availability win the most jobs — keep your calendar current.
            </Text>
          )}
        </Card>
      ) : null}

      {/* today schedule */}
      <SectionHeader title={t('pro.todaySchedule')} icon="time-outline" />
      {todayJobs.length ? (
        todayJobs.map((j) => (
          <Card key={j.id} onPress={() => navigation.navigate('BookingDetail', { bookingId: j.id })}>
            <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '800' }}>
              {j.scheduledAt ? `${formatTime(j.scheduledAt.start)} · ${formatDate(j.scheduledAt.date)}` : 'TBD'}
            </Text>
            <Text style={{ color: palette.text, fontSize: 15.5, fontWeight: '700', marginTop: 4 }}>{j.serviceName}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 2 }}>
              {j.customerName} · {j.subcity} · {money(j.total)}
            </Text>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={{ color: palette.textMuted, fontSize: 14 }}>No jobs scheduled for today. Keep your availability open to win more.</Text>
        </Card>
      )}

      {/* new leads */}
      <View style={{ height: 14 }} />
      <SectionHeader
        title={t('pro.leadFeed')}
        actionLabel={t('common.viewAll')}
        onAction={() => navigation.navigate('LeadsTab')}
        icon="flash-outline"
      />
      {leads === null ? (
        <Card>
          <Text style={{ color: palette.textMuted }}>{t('common.loading')}</Text>
        </Card>
      ) : newLeads.length ? (
        newLeads.slice(0, 2).map((l) => (
          <LeadCard
            key={l.id}
            lead={l}
            request={requests[l.requestId]}
            onPress={() => navigation.navigate('LeadDetail', { leadId: l.id })}
          />
        ))
      ) : (
        <Card>
          <Text style={{ color: palette.textMuted, fontSize: 14, lineHeight: 20 }}>{t('pro.leadEmptyHint')}</Text>
        </Card>
      )}

      {activeJobs.filter((j) => j.scheduledAt && j.scheduledAt.date !== new Date().toISOString().slice(0, 10)).length ? (
        <>
          <View style={{ height: 14 }} />
          <SectionHeader title="Upcoming" icon="calendar-outline" />
          {activeJobs
            .filter((j) => j.scheduledAt && j.scheduledAt.date !== new Date().toISOString().slice(0, 10))
            .slice(0, 3)
            .map((j) => (
              <Card key={j.id} onPress={() => navigation.navigate('BookingDetail', { bookingId: j.id })}>
                <Text style={{ color: palette.textMuted, fontSize: 12 }}>{j.scheduledAt ? relativeDate(j.scheduledAt.date) : ''}</Text>
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700', marginTop: 2 }}>{j.serviceName} · {j.customerName}</Text>
              </Card>
            ))}
        </>
      ) : null}
      <View style={{ height: 10 }} />
    </Screen>
  );
}

function Stat({ label, value, icon, tone, onPress }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: 'accent' | 'info'; onPress: () => void }) {
  const { palette, radius, shadow } = useTheme();
  const bar = tone === 'accent' ? palette.accent : palette.info;
  return (
    <Pressable onPress={onPress} style={[styles.stat, { borderRadius: radius.lg, backgroundColor: palette.surface, borderColor: palette.border }, shadow.sm]}>
      <View style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 3, borderRadius: 2, backgroundColor: bar, opacity: 0.85 }} />
      <Ionicons name={icon} size={19} color={bar} />
      <Text style={{ color: palette.text, fontSize: 21, fontWeight: '900', marginTop: 8 }}>{value}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, marginBottom: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  heroEarnings: { color: '#fff', fontSize: 31, fontWeight: '900', letterSpacing: -0.5, marginTop: 8 },
  heroCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: { flex: 1, borderWidth: 1, padding: 16, alignItems: 'flex-start' },
});
