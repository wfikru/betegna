import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useTheme } from '../../state/ThemeContext';
import type { Booking, UserRole } from '../../models/types';
import { BOOKING_STATUS } from '../../constants/status';
import { formatDate, formatTime, money } from '../../utils/format';

export function BookingCard({ booking, role, onPress }: { booking: Booking; role: UserRole; onPress: () => void }) {
  const { palette } = useTheme();
  const status = BOOKING_STATUS[booking.status];
  const accent =
    booking.status === 'completed' ? palette.success
      : booking.status === 'cancelled' || booking.status === 'disputed' ? palette.danger
        : booking.status === 'in_progress' ? palette.warning
          : palette.info;
  const otherName = role === 'professional' ? booking.customerName : booking.proName;
  const otherPhoto = role === 'professional' ? undefined : booking.proPhotoURL;
  return (
    <Card onPress={onPress} style={{ borderLeftWidth: 4, borderLeftColor: accent }}>
      <View style={styles.top}>
        <Avatar name={otherName} uri={otherPhoto} size={44} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15.5, fontWeight: '700' }}>
            {booking.serviceName}
          </Text>
          <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 13, marginTop: 2 }}>
            with {otherName}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <View style={[styles.foot, { borderTopColor: palette.border }]}>
        {booking.scheduledAt ? (
          <Text style={{ color: palette.textMuted, fontSize: 13, flex: 1 }}>
            📅 {formatDate(booking.scheduledAt.date)} · {formatTime(booking.scheduledAt.start)}
          </Text>
        ) : (
          <Text style={{ color: palette.textMuted, fontSize: 13, flex: 1 }}>Schedule TBD</Text>
        )}
        <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '800' }}>{money(booking.total)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  foot: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
});
