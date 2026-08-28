import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { BookingCard } from '../../components/cards/BookingCard';
import { FadeIn } from '../../components/common/Motion';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { Booking } from '../../models/types';
import { subscribeBookings } from '../../services/bookings';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';

const UPCOMING: Booking['status'][] = ['requested', 'confirmed', 'rescheduled', 'in_progress'];
const PAST: Booking['status'][] = ['completed', 'cancelled', 'no_show', 'disputed'];

export default function BookingsScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeBookings(user.uid, 'customer', setBookings);
  }, [user]);

  const upcoming = (bookings ?? []).filter((b) => UPCOMING.includes(b.status));
  const past = (bookings ?? []).filter((b) => PAST.includes(b.status));
  const awaitingReview = past.filter((b) => b.status === 'completed' && !b.reviewed);

  return (
    <Screen scroll>
      <PageHeader title="Bookings" fallbackTab="ProfileTab" />
      <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800', marginBottom: 4 }}>{t('booking.bookings')}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14, marginBottom: 18, lineHeight: 20 }}>
        Track every job you've booked — pay, review and rebook in one place.
      </Text>

      {bookings === null ? (
        <SkeletonList rows={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('booking.empty')}
          message="Accept a quote and your booking will appear here."
          action={<Button label={t('request.new')} onPress={() => navigation.navigate('HomeTab')} />}
        />
      ) : (
        <>
          {awaitingReview.length ? (
            <View style={[styles.reviewNudge, { backgroundColor: palette.accentSoft, borderRadius: 14 }]}>
              <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', flex: 1 }}>
                ⭐ {awaitingReview.length} completed {awaitingReview.length === 1 ? 'job is' : 'jobs are'} waiting for your review
              </Text>
            </View>
          ) : null}

          {upcoming.length ? (
            <>
              <Text style={styles.sectionLabel}>{t('booking.upcoming').toUpperCase()} · {upcoming.length}</Text>
              {upcoming.map((b, i) => (
                <FadeIn key={b.id} delay={i * 70}>
                  <BookingCard booking={b} role="customer" onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })} />
                </FadeIn>
              ))}
            </>
          ) : null}

          {past.length ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 6 }]}>{t('booking.past').toUpperCase()} · {past.length}</Text>
              {past.map((b, i) => (
                <View key={b.id}>
                  <BookingCard
                    booking={b}
                    role="customer"
                    onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
                  />
                  {b.status === 'completed' && !b.reviewed ? (
                    <Button
                      label={t('booking.leaveReview')}
                      variant="secondary"
                      size="sm"
                      icon="star-outline"
                      onPress={() =>
                        navigation.navigate('ReviewComposer', { bookingId: b.id, proId: b.proId, proName: b.proName })
                      }
                      style={{ marginTop: -4, marginBottom: 4 }}
                    />
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, color: '#8A9B93', marginBottom: 10 },
  reviewNudge: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 16 },
});
