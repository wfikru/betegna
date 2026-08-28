import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

/** Staggered entrance: gentle rise + fade on mount. Use `delay` (e.g. index * 60). */
export function FadeIn({
  children,
  delay = 0,
  dy = 14,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  dy?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, [a, delay]);
  const ty = a.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] });
  return (
    <Animated.View style={[{ opacity: a, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>
  );
}

/** Eased count-up for money/numbers (Animated-driven, cross-platform safe). */
export function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = React.useState(target);
  const progress = useRef(new Animated.Value(target > 0 ? 1 : 0)).current;

  useEffect(() => {
    if (target <= 0) {
      progress.setValue(0);
      setDisplay(0);
      return;
    }
    // animate from the currently shown value, not from 0 (no flash)
    progress.setValue(0);
    const listener = progress.addListener(({ value }) => setDisplay(Math.round(target * value)));
    Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false }).start();
    return () => progress.removeListener(listener);
  }, [target, duration, progress]);

  return display;
}
