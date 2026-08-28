import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../state/ThemeContext';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';

/**
 * Unified page header for non-hero stack screens:
 * back chevron · title · optional right action · hairline divider.
 * (Gradient heroes — Home, Request/Booking/Lead detail, Pro profile — stay custom.)
 */
export function PageHeader({
  title,
  subtitle,
  right,
  fallbackTab = 'ProfileTab',
  style,
}: {
  title: string;
  subtitle?: string;
  /** right action slot (small button / text link) */
  right?: React.ReactNode;
  /** tab to land on when there is no navigation history (deep links) */
  fallbackTab?: 'ProfileTab' | 'HomeTab' | 'DashTab' | 'RequestsTab' | 'LeadsTab' | 'CalendarTab';
  style?: ViewStyle;
}) {
  const { palette } = useTheme();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(fallbackTab as 'ProfileTab');
  };

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 10) + 4 }, style]}>
      <View style={styles.row}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={{ marginLeft: 10 }}>{right}</View> : null}
      </View>
      <View style={[styles.divider, { backgroundColor: palette.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 12.5, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth * 1.5, marginTop: 10 },
});
