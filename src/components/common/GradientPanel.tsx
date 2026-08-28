import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../state/ThemeContext';

/** Warm-Premium hero header: emerald → deep green diagonal gradient. */
export function GradientPanel({
  children,
  style,
  colors,
  bottomRadius,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: [string, string];
  /** extra-soft bottom corners so heroes blend into the cream background */
  bottomRadius?: number;
}) {
  const { palette } = useTheme();
  const stops = colors ?? [palette.primary, palette.primaryDark];
  return (
    <View
      style={[
        style as StyleProp<ViewStyle>,
        bottomRadius ? { borderBottomLeftRadius: bottomRadius, borderBottomRightRadius: bottomRadius } : null,
        { overflow: 'hidden' },
      ]}
    >
      <LinearGradient colors={stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
