import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../state/ThemeContext';

export function Chip({
  label,
  selected,
  onPress,
  iconNode,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional icon node (e.g. CategoryIcon) rendered before the label. */
  iconNode?: React.ReactNode;
}) {
  const { palette, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: radius.full,
          backgroundColor: selected ? palette.primary : palette.surface,
          borderColor: selected ? palette.primary : palette.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {iconNode}
      <Text style={{ color: selected ? palette.onPrimary : palette.text, fontSize: 13.5, fontWeight: selected ? '800' : '600' }}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
});
