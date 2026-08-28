import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';

export function Rating({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half' : 'star-outline'}
          size={size + 2}
          color={palette.star}
          style={{ marginRight: 1 }}
        />
      ))}
      <Text style={{ color: palette.text, fontSize: size, fontWeight: '700', marginLeft: 4 }}>
        {value > 0 ? value.toFixed(1) : 'New'}
      </Text>
      {count != null ? (
        <Text style={{ color: palette.textMuted, fontSize: size, marginLeft: 4 }}>({count})</Text>
      ) : null}
    </View>
  );
}

export function StarPicker({ value, onChange, size = 34 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${i} stars`}>
          <Ionicons
            name={value >= i ? 'star' : 'star-outline'}
            size={size}
            color={value >= i ? palette.star : palette.textMuted}
            style={{ marginRight: 10 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
