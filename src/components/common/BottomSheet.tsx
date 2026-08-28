import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../state/ThemeContext';
import { Button } from './Button';

/**
 * Branded bottom sheet (replaces raw Alert.alert for confirmations):
 * scrim + slide-up card with drag handle, title, message, actions.
 */
export function BottomSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, slide]);

  const ty = slide.interpolate({ inputRange: [0, 1], outputRange: [280, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.scrim, { backgroundColor: palette.overlay }]} onPress={onClose} accessibilityLabel="Dismiss" />
      <View pointerEvents="box-none" style={[styles.host, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Animated.View
          style={[
            styles.sheet,
            {
              borderRadius: radius.xl,
              backgroundColor: palette.surface,
              borderColor: palette.border,
              transform: [{ translateY: ty }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: palette.border }]} />
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text> : null}
          <View style={{ height: 18 }} />
          <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} size="lg" onPress={onConfirm} />
          <View style={{ height: 8 }} />
          <Button label={cancelLabel} variant="ghost" size="md" onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject },
  host: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', paddingHorizontal: 12 },
  sheet: { borderWidth: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16 },
  handle: { alignSelf: 'center', width: 40, height: 4.5, borderRadius: 3, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  message: { fontSize: 14, lineHeight: 21, marginTop: 8 },
});
