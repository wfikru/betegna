import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={17} color={palette.primary} style={{ marginRight: 7 }} /> : null}
        <Text style={{ color: palette.text, fontSize: 17, fontWeight: '700' }}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: palette.primary, fontSize: 13.5, fontWeight: '700' }}>
            {actionLabel} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } });
