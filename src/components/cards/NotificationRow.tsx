import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';
import type { AppNotification } from '../../models/types';
import { relativeTime } from '../../utils/format';

const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  message: 'chatbubble',
  request: 'clipboard',
  quote: 'pricetag',
  booking: 'calendar',
  payment: 'card',
  review: 'star',
  lead: 'flash',
  system: 'information-circle',
};

export function NotificationRow({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: n.read ? palette.surface : palette.primarySoft, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: palette.surface }]}>
        <Ionicons name={KIND_ICON[n.kind] ?? 'notifications'} size={20} color={palette.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', flex: 1 }}>
            {n.title}
          </Text>
          {!n.read ? <View style={[styles.dot, { backgroundColor: palette.accent }]} /> : null}
        </View>
        <Text numberOfLines={2} style={{ color: palette.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
          {n.body}
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 11.5, marginTop: 4 }}>{relativeTime(n.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
});
