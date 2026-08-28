import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import type { Tone } from '../../constants/status';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { palette, radius } = useTheme();
  const toneColor: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: palette.surfaceAlt, fg: palette.textMuted },
    info: { bg: palette.info + '22', fg: palette.info },
    success: { bg: palette.success + '22', fg: palette.success },
    warning: { bg: palette.warning + '22', fg: palette.warning },
    danger: { bg: palette.danger + '22', fg: palette.danger },
    accent: { bg: palette.accentSoft, fg: palette.accent },
    amberFilled: { bg: '#F5A623', fg: '#3D2A00' },
  };
  const c = toneColor[tone];
  return (
    <Text style={[styles.badge, { backgroundColor: c.bg, color: c.fg, borderRadius: radius.sm }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: { fontSize: 11.5, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', alignSelf: 'flex-start' },
});
