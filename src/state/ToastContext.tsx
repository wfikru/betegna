import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'danger';
}

interface ToastApi {
  show: (message: string, tone?: ToastState['tone']) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Global toast host — render once above the navigator; use useToast() anywhere. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { palette, radius, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const counter = useRef(0);

  const show = useCallback((message: string, tone: ToastState['tone'] = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, message, tone });
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        setToast(null),
      );
    }, 2300);
  }, [anim]);

  const toneColor = toast?.tone === 'danger' ? palette.danger : toast?.tone === 'info' ? palette.info : palette.success;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.host, { top: insets.top + 56 }]}>
          <Animated.View
            style={[
              styles.toast,
              shadow.md,
              { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, opacity: anim },
            ]}
          >
            <Ionicons name={toast.tone === 'danger' ? 'alert-circle' : 'checkmark-circle'} size={19} color={toneColor} />
            <Text style={{ color: palette.text, fontSize: 13.5, fontWeight: '700', marginLeft: 9 }} numberOfLines={2}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2000, elevation: 12 },
  toast: { flexDirection: 'row', alignItems: 'center', maxWidth: 320, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
});
