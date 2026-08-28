import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/common/Screen';
import { NotificationRow } from '../../components/cards/NotificationRow';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { Chip } from '../../components/common/Chip';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { AppNotification, NotificationKind } from '../../models/types';
import { markAllNotificationsRead, markNotificationRead, subscribeNotifications } from '../../services/notifications';
import type { LinkingOptions } from '@react-navigation/native';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';

const CATEGORIES: { id: 'all' | 'unread' | NotificationKind; label: string }[] = [
  { id: 'all', label: t('noti.all') },
  { id: 'unread', label: t('noti.unread') },
  { id: 'message', label: 'Messages' },
  { id: 'quote', label: 'Quotes' },
  { id: 'booking', label: 'Bookings' },
  { id: 'lead', label: 'Leads' },
];

/** betegna://request/123 → navigate('RequestDetail', { requestId: '123' }) */
function deepLinkToNavigation(
  deepLink: string,
  navigate: (screen: keyof RootStackParamList, params: unknown) => void,
): boolean {
  try {
    const path = deepLink.replace(/^betegna:\/\//, '').replace(/^https:\/\/betegna\.app\//, '');
    const [head, id] = path.split('/');
    switch (head) {
      case 'request':
        navigate('RequestDetail', { requestId: id ?? '' });
        return true;
      case 'conversation':
        navigate('ChatThread', { conversationId: id ?? '' });
        return true;
      case 'booking':
        navigate('BookingDetail', { bookingId: id ?? '' });
        return true;
      case 'professional':
        navigate('ProProfile', { proId: id ?? '' });
        return true;
      case 'leads':
        navigate('ProTabs', { screen: 'LeadsTab' });
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationKind>('all');

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setNotifications);
  }, [user]);

  const visible = useMemo(() => {
    const list = notifications ?? [];
    if (filter === 'all') return list;
    if (filter === 'unread') return list.filter((n) => !n.read);
    return list.filter((n) => n.kind === filter);
  }, [notifications, filter]);

  const open = (n: AppNotification) => {
    if (user) void markNotificationRead(user.uid, n.id);
    if (n.deepLink) {
      const ok = deepLinkToNavigation(n.deepLink, (screen, params) => {
        // typed navigation cast: params already shaped per screen
        (navigation.navigate as unknown as (s: string, p: unknown) => void)(screen as string, params);
      });
      if (ok) return;
    }
    navigation.goBack();
  };

  return (
    <Screen scroll padded={false}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12), backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: '800', marginLeft: 8, flex: 1 }}>{t('noti.title')}</Text>
        <Pressable onPress={() => user && void markAllNotificationsRead(user.uid)} hitSlop={8}>
          <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '700' }}>{t('noti.markAll')}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} selected={filter === c.id} onPress={() => setFilter(c.id)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {notifications === null ? (
          <SkeletonList rows={4} height={64} />
        ) : visible.length ? (
          visible.map((n) => <NotificationRow key={n.id} n={n} onPress={() => open(n)} />)
        ) : (
          <EmptyState icon="notifications-off-outline" title={t('noti.empty')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
});
