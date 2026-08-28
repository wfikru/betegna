import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../state/ThemeContext';

export function Card({
  children,
  onPress,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const { palette, radius, shadow } = useTheme();
  const base: ViewStyle = {
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    padding: padded ? 16 : undefined,
    marginBottom: 12, // default rhythm between cards (overridden per-screen via style)
    ...shadow.sm,
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [base, style, { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function ProgressBar({ pct, height = 8 }: { pct: number; height?: number }) {
  const { palette, radius } = useTheme();
  return (
    <View style={[styles.track, { height, borderRadius: radius.full, backgroundColor: palette.surfaceAlt }]}>
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height,
          borderRadius: radius.full,
          backgroundColor: palette.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ track: { overflow: 'hidden', width: '100%' } });
