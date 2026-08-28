import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../state/ThemeContext';
import { t } from '../../i18n';

export function TypingIndicator({ name }: { name?: string }) {
  const { palette, radius } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: false }),
        Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: false }),
      ]));
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 180);
    const a3 = anim(dot3, 360);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, { backgroundColor: palette.surface, borderRadius: radius.lg, borderColor: palette.border }]}>
        <Animated.View style={[styles.dot, { opacity: dot1, backgroundColor: palette.textMuted }]} />
        <Animated.View style={[styles.dot, { opacity: dot2, backgroundColor: palette.textMuted }]} />
        <Animated.View style={[styles.dot, { opacity: dot3, backgroundColor: palette.textMuted }]} />
      </View>
      {name ? (
        <Text style={{ color: palette.textMuted, fontSize: 11.5, marginLeft: 6 }}>{t('chat.typing', { name })}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  bubble: { flexDirection: 'row', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
