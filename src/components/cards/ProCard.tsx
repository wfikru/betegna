import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Rating } from '../common/Rating';
import { Badge } from '../common/Badge';
import { useTheme } from '../../state/ThemeContext';
import type { ProfessionalProfile } from '../../models/types';
import { money } from '../../utils/format';
import { formatDistance } from '../../utils/format';
import { PRICE_UNIT_LABEL } from '../../config/brand';

export function ProCard({
  pro,
  score,
  distanceKm,
  onPress,
  secondary,
}: {
  pro: ProfessionalProfile;
  score?: number;
  distanceKm?: number;
  onPress?: () => void;
  secondary?: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={styles.top}>
        <Avatar name={pro.displayName} uri={pro.photoURL} size={56} online={pro.online} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={{ color: palette.text, fontSize: 16, fontWeight: '700', flex: 1 }}>
              {pro.businessName || pro.displayName}
            </Text>
            {score != null ? (
              <View style={[styles.score, { backgroundColor: palette.primarySoft }]}>
                <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '800' }}>
                  {Math.round(score)}% match
                </Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 13 }}>
            {pro.displayName} · {pro.yearsExperience} yrs · {pro.serviceArea.slice(0, 3).join(', ')}
            {distanceKm != null ? ` · ${formatDistance(distanceKm)}` : ''}
          </Text>
          <View style={styles.metaRow}>
            <Rating value={pro.rating} count={pro.reviewCount} />
          </View>
        </View>
      </View>
      <View style={[styles.badges, { borderTopColor: palette.border }]}>
        {pro.verified ? (
          <Badge label="✓ Verified" tone="success" />
        ) : pro.badges.length === 0 ? (
          <Badge label="New pro" tone="neutral" />
        ) : null}
        {pro.badges.slice(0, 2).map((b) => (
          <Badge key={b} label={b} tone="info" />
        ))}
        <View style={{ flex: 1 }} />
        <View style={styles.price}>
          <Text style={{ color: palette.textMuted, fontSize: 11 }}>from </Text>
          <Text style={{ color: palette.text, fontSize: 15, fontWeight: '800' }}>
            {money(pro.startingPrice)}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 11 }}>{PRICE_UNIT_LABEL[pro.priceUnit]}</Text>
        </View>
      </View>
      <View style={[styles.foot, { borderTopColor: palette.border }]}>
        <View style={styles.stat}>
          <Ionicons name="flash" size={13} color={palette.accent} />
          <Text style={{ color: palette.textMuted, fontSize: 12, marginLeft: 4 }}>
            replies in ~{pro.medianResponseMinutes}m
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-done" size={13} color={palette.success} />
          <Text style={{ color: palette.textMuted, fontSize: 12, marginLeft: 4 }}>
            {pro.jobsCompleted} jobs
          </Text>
        </View>
        {secondary ? <View style={styles.actions}>{secondary}</View> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row' },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  score: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  metaRow: { marginTop: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, alignItems: 'center' },
  price: { flexDirection: 'row', alignItems: 'baseline' },
  foot: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, gap: 14, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end', gap: 8 },
});
