import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Booking, ProfessionalProfile } from '../../models/types';
import { getPro } from '../../services/professionals';
import { subscribeBookings } from '../../services/bookings';
import { addDaysISO, formatDate, formatTime, money, todayISO } from '../../utils/format';
import { BOOKING_STATUS, WEEKDAYS } from '../../constants/status';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';

const STRIP_DAYS = 14; // today + next two weeks

/** e.g. enabled [1..6] 08:00–18:00 → "Mon–Sat · 8 AM–6 PM" */
function summarizeAvailability(profile: ProfessionalProfile | null): { days: string; hours: string } {
  if (!profile) return { days: '—', hours: '' };
  const wh = profile.availability.workingHours;
  const enabled = Object.entries(wh)
    .filter(([, w]) => w.enabled)
    .map(([d]) => Number(d));
  if (!enabled.length) return { days: 'No working days set', hours: '' };
  const days =
    enabled.length === 7
      ? 'Every day'
      : enabled.length === 5 && [1, 2, 3, 4, 5].every((d) => enabled.includes(d))
        ? 'Mon–Fri'
        : enabled.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => enabled.includes(d))
          ? 'Mon–Sat'
          : enabled.map((d) => WEEKDAYS[d]).join(', ');
  const first = wh[enabled[0] ?? 1];
  const hours = first ? `${formatTime(first.start).replace(':00', '')}–${formatTime(first.end).replace(':00', '')}` : '';
  return { days, hours };
}

export default function ProCalendarScreen() {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [jobs, setJobs] = useState<Booking[] | null>(null);
  const [selected, setSelected] = useState(todayISO());

  useEffect(() => {
    if (!user) return;
    void getPro(user.uid).then(setProfile);
    return subscribeBookings(user.uid, 'professional', setJobs);
  }, [user]);

  /** bookings by ISO date (scheduled, not cancelled) */
  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const j of jobs ?? []) {
      if (!j.scheduledAt || j.status === 'cancelled') continue;
      (map[j.scheduledAt.date] ??= []).push(j);
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.scheduledAt!.start.localeCompare(b.scheduledAt!.start));
    return map;
  }, [jobs]);

  const strip = useMemo(() => Array.from({ length: STRIP_DAYS }, (_, i) => addDaysISO(i)), []);
  const dayJobs = byDate[selected] ?? [];
  const dayTotal = dayJobs.reduce((s, j) => s + j.total, 0);
  const upcomingCount = strip.reduce((n, d) => n + (byDate[d]?.length ?? 0), 0);
  const avail = summarizeAvailability(profile);
  const workingThatDay = profile ? (profile.availability.workingHours[new Date(`${selected}T00:00:00`).getDay()]?.enabled ?? false) : true;

  return (
    <Screen scroll style={{ paddingBottom: 110 }}>
      <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800' }}>My schedule</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14, marginTop: 4, marginBottom: 16, lineHeight: 20 }}>
        {upcomingCount > 0
          ? `${upcomingCount} job${upcomingCount > 1 ? 's' : ''} in the next two weeks.`
          : 'Your confirmed jobs will appear here as an agenda.'}
      </Text>

      {/* ── horizontal day strip ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6, paddingRight: 8 }}>
        {strip.map((iso) => {
          const isSelected = iso === selected;
          const count = byDate[iso]?.length ?? 0;
          const day = new Date(`${iso}T00:00:00`);
          return (
            <Pressable
              key={iso}
              onPress={() => setSelected(iso)}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAYS[day.getDay()]} ${day.getDate()}${count ? `, ${count} jobs` : ''}`}
              style={[
                styles.dayChip,
                {
                  borderRadius: radius.lg,
                  backgroundColor: isSelected ? palette.primary : palette.surface,
                  borderColor: isSelected ? palette.primary : palette.border,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected ? 'rgba(255,255,255,0.85)' : palette.textMuted,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                }}
              >
                {iso === todayISO() ? 'TODAY' : WEEKDAYS[day.getDay()]?.toUpperCase()}
              </Text>
              <Text
                style={{
                  color: isSelected ? palette.onPrimary : palette.text,
                  fontSize: 17,
                  fontWeight: '800',
                  marginTop: 2,
                }}
              >
                {day.getDate()}
              </Text>
              <View style={styles.dotRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: count > 0 ? (isSelected ? palette.onPrimary : palette.accent) : 'transparent' },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── selected day agenda ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 10, gap: 8 }}>
        <Text style={{ color: palette.text, fontSize: 17, fontWeight: '800', flex: 1 }}>
          {selected === todayISO() ? 'Today' : formatDate(selected)}
        </Text>
        {dayJobs.length ? (
          <Badge label={`${dayJobs.length} job${dayJobs.length > 1 ? 's' : ''} · ${money(dayTotal)}`} tone="accent" />
        ) : workingThatDay ? (
          <Badge label="Free" tone="success" />
        ) : (
          <Badge label="Day off" tone="neutral" />
        )}
      </View>

      {dayJobs.length ? (
        dayJobs.map((j, i) => {
          const status = BOOKING_STATUS[j.status];
          return (
            <Card key={j.id} onPress={() => navigation.navigate('BookingDetail', { bookingId: j.id })}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.timeBox, { borderRadius: radius.md, backgroundColor: palette.primarySoft }]}>
                  <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '800' }}>
                    {j.scheduledAt ? formatTime(j.scheduledAt.start).replace(':00', '') : '—'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                    {j.serviceName}
                  </Text>
                  <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>
                    {j.customerName} · {j.subcity} · {money(j.total)}
                  </Text>
                </View>
                <Badge label={status.label} tone={status.tone} />
              </View>
              {i < dayJobs.length - 1 ? null : null}
            </Card>
          );
        })
      ) : jobs === null ? null : (
        <Card>
          <Text style={{ color: palette.textMuted, fontSize: 14, lineHeight: 20 }}>
            {workingThatDay
              ? 'No jobs this day. Respond to leads fast — pros who quote first usually win them.'
              : 'This weekday is marked off in your working hours.'}
          </Text>
        </Card>
      )}

      {/* ── availability summary (editor lives in Profile) ── */}
      <View style={{ height: 16 }} />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={19} color={palette.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700' }}>
              {t('pro.workingHours')} · {avail.days}
            </Text>
            {avail.hours ? (
              <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>
                {avail.hours} — customers can only book within these hours
              </Text>
            ) : null}
          </View>
          <Button label="Edit" variant="secondary" size="sm" onPress={() => navigation.navigate('ProProfileEdit')} />
        </View>
      </Card>

      <View style={{ height: 12 }} />
    </Screen>
  );
}


const styles = StyleSheet.create({
  dayChip: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', width: 56, height: 68, marginRight: 8, gap: 2 },
  dotRow: { height: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  timeBox: { paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 56 },
});
