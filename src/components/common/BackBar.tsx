import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import { t } from '../../i18n';

type CustomerTabName = 'ProfileTab' | 'HomeTab' | 'RequestsTab';
type ProTabName = 'DashTab' | 'LeadsTab' | 'CalendarTab' | 'ProProfileTab';
type FallbackTab = CustomerTabName | ProTabName;

/**
 * Back affordance for stack screens. If there is no navigation history
 * (e.g. the screen was opened directly via URL or deep link), it falls back
 * to a sensible TAB — navigating through the tab container, since stack
 * screens can only address nested tabs via their parent navigator.
 */
export function BackBar({ fallbackTab = 'ProfileTab' }: { fallbackTab?: FallbackTab }) {
  const { palette } = useTheme();
  const navigation = useAppNavigation();

  const goFallback = () => {
    const proTabs: readonly string[] = ['DashTab', 'LeadsTab', 'CalendarTab', 'ProProfileTab'];
    if (proTabs.includes(fallbackTab)) {
      navigation.navigate('ProTabs', { screen: fallbackTab as ProTabName });
    } else {
      navigation.navigate('CustomerTabs', { screen: fallbackTab as CustomerTabName });
    }
  };

  return (
    <Pressable
      onPress={() => (navigation.canGoBack() ? navigation.goBack() : goFallback())}
      hitSlop={10}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
    >
      <Ionicons name="chevron-back" size={20} color={palette.primary} />
      <Text style={{ color: palette.primary, fontSize: 15, fontWeight: '700', marginLeft: 2 }}>
        {t('common.back')}
      </Text>
    </Pressable>
  );
}

export type { FallbackTab, CustomerTabName, ProTabName };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 6, alignSelf: 'flex-start' },
});
