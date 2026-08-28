import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  full?: boolean;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, loading, icon, style, full = true }: Props) {
  const { palette, radius } = useTheme();

  const height = size === 'sm' ? 36 : size === 'lg' ? 54 : 46;
  const font = size === 'sm' ? 14 : size === 'lg' ? 17 : 15.5;

  const colors: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: palette.primary, fg: palette.onPrimary, border: palette.primary },
    secondary: { bg: 'transparent', fg: palette.primary, border: palette.primary },
    ghost: { bg: 'transparent', fg: palette.text, border: palette.border },
    danger: { bg: palette.danger, fg: '#fff', border: palette.danger },
    accent: { bg: palette.accent, fg: palette.onAccent, border: palette.accent },
  };
  const c = colors[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        full ? styles.full : null,
        {
          height,
          borderRadius: radius.md,
          backgroundColor: c.bg,
          borderWidth: 1.5,
          borderColor: c.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={font + 2} color={c.fg} style={{ marginRight: 7 }} /> : null}
          <Text style={{ color: c.fg, fontSize: font, fontWeight: '700' }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  full: { alignSelf: 'stretch' },
});
