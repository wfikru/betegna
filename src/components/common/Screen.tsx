import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../state/ThemeContext';

interface Props {
  children?: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scroll = false, padded = true, style }: Props) {
  const { palette } = useTheme();
  const body = padded ? { paddingHorizontal: 16, paddingBottom: 24 } : undefined;
  if (scroll) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[body, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.flex, body, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
