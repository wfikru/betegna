import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import { BENTO_TINTS, type AvatarTint } from './avatarTints';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic tint index from a name. */
export function tintForName(name: string): AvatarTint {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return BENTO_TINTS[hash % BENTO_TINTS.length]!;
}

/**
 * Tinted-initials avatar — consistent across sessions, no network images,
 * no broken photos. (Professional imagery lives in portfolios instead.)
 */
export function Avatar({ name, uri, size = 48, online }: { name: string; uri?: string; size?: number; online?: boolean }) {
  const { palette } = useTheme();
  void uri;
  const tint = tintForName(name);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tint.bg,
            borderColor: tint.border,
          },
        ]}
      >
        <Text style={{ color: tint.fg, fontWeight: '800', fontSize: Math.max(11, size * 0.36) }}>
          {initials(name) || '?'}
        </Text>
      </View>
      {online ? (
        <View
          style={[
            styles.dot,
            {
              borderColor: palette.surface,
              backgroundColor: palette.success,
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  dot: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2 },
});
