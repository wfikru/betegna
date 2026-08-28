import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';

export function EmptyState({
  icon = 'leaf-outline',
  title,
  message,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { palette, spacing } = useTheme();
  return (
    <View style={[styles.wrap, { paddingVertical: spacing.xl }]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.primarySoft }]}>
        <Ionicons name={icon} size={30} color={palette.primary} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {message ? <Text style={[styles.msg, { color: palette.textMuted }]}>{message}</Text> : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  msg: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
