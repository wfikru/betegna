import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';

export function Skeleton({ width, height, radius: rad = 10, style }: { width?: number | `${number}%`; height: number; radius?: number; style?: object }) {
  const { palette } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }), Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: false })]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: rad, backgroundColor: palette.skeleton, opacity }, style]}
    />
  );
}

export function SkeletonList({ rows = 3, height = 84 }: { rows?: number; height?: number }) {
  return (
    <View style={styles.col}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={height} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ col: { width: '100%' } });
