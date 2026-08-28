import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { navigationRef } from '../../app/navigation/navigationRef';
import { subscribeNotifications } from '../../services/notifications';

/** Screens with their own top-right controls (close/progress) where the bell would collide. */
const HIDDEN_ON = ['Notifications', 'RequestWizard', 'Matching', 'ProOnboarding'];

/**
 * Global notification bell — overlays every authenticated screen at the
 * top-right corner with an unread badge; deep-links to the Notification Center.
 *
 * Deliberately uses NO navigation hooks and NO ref reads: the current leaf
 * route is passed in by RootNavigator via the container's onStateChange.
 * The only ref use is a guarded navigate on tap.
 */
export function NotificationBell({ leafRoute }: { leafRoute: string }) {
  const { palette, radius, shadow } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, (list) => setUnread(list.filter((n) => !n.read).length));
  }, [user]);

  if (!user || HIDDEN_ON.includes(leafRoute)) return null;

  return (
    <Pressable
      onPress={() => {
        try {
          if (navigationRef.isReady()) navigationRef.navigate('Notifications');
        } catch {
          /* container not ready — ignore tap */
        }
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Notifications${unread ? `, ${unread} unread` : ''}`}
      style={[
        styles.bell,
        shadow.sm,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderRadius: radius.full,
          top: insets.top + 4,
        },
      ]}
    >
      <Ionicons name="notifications-outline" size={19} color={palette.text} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: palette.accent }]}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bell: {
    position: 'absolute',
    right: 12,
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
});
