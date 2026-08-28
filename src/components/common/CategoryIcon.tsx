import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { getCategory, categoryOfService } from '../../config/seed/taxonomy';
import { mixHex } from './colorMix';

/** Warm cream base tiles are blended toward. */
const CREAM = '#F7F0E1';

/**
 * Category icon — the original emoji imagery in a soft category-tinted tile.
 * (Emoji restored per product decision; consistent sizes across the app.)
 */
export function CategoryIcon({
  categoryId,
  size = 'md',
  style,
}: {
  categoryId: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}) {
  const cat = getCategory(categoryId);
  const base = cat?.color ?? '#0B6B45';
  const dims = size === 'lg' ? 56 : size === 'md' ? 42 : 30;
  const emojiSize = size === 'lg' ? 28 : size === 'md' ? 21 : 16;
  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.wrap,
        {
          width: dims,
          height: dims,
          borderRadius: dims * 0.3,
          backgroundColor: mixHex(base, CREAM, 0.16),
        },
        style,
      ]}
    >
      <Text style={{ fontSize: emojiSize }}>{cat?.emoji ?? '🔧'}</Text>
    </View>
  );
}

/** Icon for a service id (resolves its category). */
export function ServiceGlyph({ serviceId, size = 'md' }: { serviceId: string; size?: 'sm' | 'md' | 'lg' }) {
  return <CategoryIcon categoryId={categoryOfService(serviceId) ?? 'home-repair'} size={size} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
