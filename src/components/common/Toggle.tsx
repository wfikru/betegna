import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';

export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label?: string }) {
  const { palette } = useTheme();
  return (
    <Pressable style={styles.row} onPress={() => onValueChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      {label ? <Text style={{ color: palette.text, fontSize: 15, flex: 1 }}>{label}</Text> : null}
      <View style={[styles.track, { backgroundColor: value ? palette.primary : palette.border }]}>
        <View style={[styles.knob, { backgroundColor: '#fff' }, value ? { right: 2 } : { left: 2 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  track: { width: 46, height: 27, borderRadius: 14, padding: 2, justifyContent: 'center' },
  knob: { position: 'absolute', width: 23, height: 23, borderRadius: 12 },
});
