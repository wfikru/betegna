import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../common/Card';
import { useTheme } from '../../state/ThemeContext';
import { getCategory } from '../../config/seed/taxonomy';
import { hexToRgba } from '../../config/theme';
import type { Category } from '../../models/types';

/**
 * Full-bleed category tile: the category's tinted gradient + large emoji cover
 * the WHOLE tile, with the label overlaid at the bottom (Airbnb-style).
 */
export function CategoryCard({ category, count, onPress }: { category: Category; count: number; onPress: () => void }) {
  const { palette } = useTheme();
  const base = category.color;
  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      {/* full-tile cover */}
      <LinearGradient
        colors={[hexToRgba(base, 0.26), hexToRgba(base, 0.07)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.emoji}>{category.emoji}</Text>
      <View style={styles.labelWrap}>
        <Text numberOfLines={1} style={[styles.label, { color: palette.text }]}>
          {category.name}
        </Text>
        <Text numberOfLines={1} style={[styles.count, { color: palette.textMuted }]}>
          {count} services
        </Text>
      </View>
    </Card>
  );
}

/**
 * Full-bleed service tile (same visual language as CategoryCard) for the
 * horizontal "Popular services" rail — gradient cover, large emoji,
 * overlaid name + from-price.
 */
export function ServiceTile({
  categoryId,
  title,
  subtitle,
  onPress,
}: {
  categoryId: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const base = getCategory(categoryId)?.color ?? '#0B6B45';
  const emoji = getCategory(categoryId)?.emoji ?? '🔧';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={styles.tile}>
      <LinearGradient
        colors={[hexToRgba(base, 0.26), hexToRgba(base, 0.07)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <View style={styles.labelWrap}>
        <Text numberOfLines={1} style={[styles.label, { color: palette.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.count, { color: palette.textMuted }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 4, minWidth: '46%', height: 118, padding: 0, overflow: 'hidden' },
  tile: { width: 150, height: 118, marginRight: 10, borderRadius: 18, overflow: 'hidden' },
  emoji: { fontSize: 44, marginTop: 14, marginLeft: 16 },
  tileEmoji: { fontSize: 42, marginTop: 13, marginLeft: 15 },
  labelWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 18, paddingBottom: 10 },
  label: { fontSize: 14.5, fontWeight: '800' },
  count: { fontSize: 11.5, marginTop: 1 },
});
