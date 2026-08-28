import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Avatar } from '../../components/common/Avatar';
import { Card, ProgressBar } from '../../components/common/Card';
import { Toggle } from '../../components/common/Toggle';
import { Chip } from '../../components/common/Chip';
import { useTheme, type ThemeMode } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t, getLocale } from '../../i18n';
import type { Locale } from '../../models/types';
import { BRAND, BUILD_ID } from '../../config/brand';
import { ENV } from '../../config/env';
import { getPro } from '../../services/professionals';
import { profileStrength } from '../../features/reviews/reputation';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import { useToast } from '../../state/ToastContext';
import { StackActions } from '@react-navigation/native';
import { navigationRef } from '../../app/navigation/navigationRef';
import type { RootStackParamList } from '../../app/navigation/types';

export default function ProfileScreen() {
  const { palette, mode, setMode } = useTheme();
  const { user, activeRole, switchRole, signOut, updateUser } = useAuth();
  const navigation = useAppNavigation();
  const [busy, setBusy] = useState(false);
  const [strength, setStrength] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!user || !user.roles.includes('professional')) return;
    void getPro(user.uid).then((p) => p && setStrength(profileStrength(p)));
  }, [user]);

  if (!user) return <Screen />;

  const doSwitch = async (role: 'customer' | 'professional') => {
    if (role === activeRole) return;
    setBusy(true);
    try {
      // dismiss pushed stack screens (Payments, etc.) so the browser-history
      // state can't rehydrate them on top of the remounted shell — only when
      // the root stack actually has something to pop (POP_TO_TOP with an empty
      // stack is an unhandled action)
      try {
        const root = navigationRef.isReady() ? navigationRef.getRootState() : null;
        if (root && (root.index ?? 0) > 0) navigationRef.dispatch(StackActions.popToTop());
      } catch {
        /* nothing to pop — proceed */
      }
      await switchRole(role); // fresh shell lands on the profile tab (roleLanding)
      toast.show(`You're now in ${role === 'professional' ? 'Professional' : 'Customer'} mode`, 'info');
    } finally {
      setBusy(false);
    }
  };

  const goProfessional = () => {
    // existing pros switch instantly; customers go through guided setup first
    if (user.roles.includes('professional')) void doSwitch('professional');
    else navigation.navigate('ProOnboarding');
  };

  return (
    <Screen scroll style={{ paddingBottom: 110 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <Avatar name={user.name} uri={user.photoURL} size={64} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: palette.text, fontSize: 20, fontWeight: '800' }}>{user.name}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 13.5, marginTop: 2 }}>{user.email}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>
            {user.homeArea ? `${user.homeArea.subcity}, ${user.homeArea.city}` : BRAND.city}
            {user.roles.length > 1 ? ' · Customer & Professional' : ''}
          </Text>
        </View>
      </View>

      {/* mode switch */}
      <Card style={{ marginBottom: 14 }}>
        <Text style={{ color: palette.text, fontSize: 15.5, fontWeight: '800' }}>{t('profile.mode')}</Text>
        <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 3, marginBottom: 12, lineHeight: 18 }}>
          {t('profile.modeHint')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ModeCard
            active={activeRole === 'customer'}
            label={t('profile.customerMode')}
            icon="person-outline"
            disabled={busy}
            onPress={() => void doSwitch('customer')}
          />
          <ModeCard
            active={activeRole === 'professional'}
            label={user.roles.includes('professional') ? t('profile.proMode') : 'Become a Pro'}
            icon="briefcase-outline"
            disabled={busy}
            onPress={goProfessional}
          />
        </View>
      </Card>


      {/* settings list */}
      <Card padded={false} style={{ marginBottom: 14 }}>
        <Row icon="language-outline" label={t('profile.language')} last>
          <View style={{ flexDirection: 'row' }}>
            <Chip label="English" selected={getLocale() === 'en'} onPress={() => void updateUser({ locale: 'en' as Locale })} />
            <Chip label="አማርኛ" selected={getLocale() === 'am'} onPress={() => void updateUser({ locale: 'am' as Locale })} />
          </View>
        </Row>
      </Card>

      {/* payments / earnings (both roles) */}
      <Card padded={false} style={{ marginBottom: 14 }}>
        <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => navigation.navigate('Payments')}>
          <Ionicons name={activeRole === 'professional' ? 'trending-up-outline' : 'card-outline'} size={20} color={palette.primary} />
          <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>
            {activeRole === 'professional' ? 'Earnings & payments' : 'Payment history'}
          </Text>
          <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => navigation.navigate('Favorites')}>
          <Ionicons name="heart-outline" size={20} color={palette.primary} />
          <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{t('profile.favorites')}</Text>
          <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
        </Pressable>
      </Card>

      {activeRole === 'professional' ? (
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="trending-up" size={17} color={palette.primary} />
            <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', marginLeft: 8, flex: 1 }}>
              {t('pro.profileStrength')}
              {strength != null ? ` · ${strength}%` : ''}
            </Text>
            <Pressable onPress={() => navigation.navigate('ProProfileEdit')} hitSlop={8}>
              <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '700' }}>Improve →</Text>
            </Pressable>
          </View>
          <ProgressBar pct={strength ?? 0} />
          {strength != null && strength < 70 ? (
            <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 8, lineHeight: 18 }}>
              Add portfolio photos, credentials and more services to win up to 3× more jobs.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {activeRole === 'professional' ? (
        <Card padded={false} style={{ marginBottom: 14 }}>
          <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => navigation.navigate('ProProfileEdit')}>
            <Ionicons name="create-outline" size={20} color={palette.primary} />
            <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>Edit professional profile</Text>
            <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => navigation.navigate('CalendarTab')}>
            <Ionicons name="time-outline" size={20} color={palette.primary} />
            <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{t('pro.availability')}</Text>
            <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
          </Pressable>
        </Card>
      ) : (
      <Card padded={false} style={{ marginBottom: 14 }}>
        <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => navigation.navigate('Bookings')}>
          <Ionicons name="calendar-outline" size={20} color={palette.primary} />
          <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{t('booking.myBookings')}</Text>
          <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('Favorites')}>
          <Ionicons name="heart-outline" size={20} color={palette.primary} />
          <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{t('profile.favorites')}</Text>
          <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
        </Pressable>
      </Card>
      )}

      <Card padded={false} style={{ marginBottom: 14 }}>
        <Row icon="notifications-outline" label={t('noti.prefs')} last>
          <Toggle value={user.notificationPrefs.channels.push} onValueChange={(v) => void updateUser({ notificationPrefs: { ...user.notificationPrefs, channels: { ...user.notificationPrefs.channels, push: v } } })} />
        </Row>
      </Card>

      <Card padded={false} style={{ marginBottom: 14 }}>
        <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => undefined}>
          <Ionicons name="help-circle-outline" size={20} color={palette.primary} />
          <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{t('profile.support')}</Text>
          <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => undefined}>
          <Ionicons name="document-text-outline" size={20} color={palette.primary} />
          <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{t('profile.legal')}</Text>
          <Ionicons name="chevron-forward" size={17} color={palette.textMuted} />
        </Pressable>
      </Card>

      <Pressable onPress={() => void signOut()} style={[styles.signOut, { borderColor: palette.danger }]}>
        <Ionicons name="log-out-outline" size={19} color={palette.danger} />
        <Text style={{ color: palette.danger, fontSize: 15, fontWeight: '700', marginLeft: 8 }}>{t('auth.signOut')}</Text>
      </Pressable>

      <Text style={{ color: palette.textMuted, fontSize: 11.5, textAlign: 'center', marginTop: 18 }}>
        {BRAND.name} {BRAND.nameAm} · v4.0.0 · build {BUILD_ID} · {ENV.isDemo ? 'Demo mode' : 'Firebase'}
      </Text>
    </Screen>
  );
}

function ModeCard({ active, label, icon, onPress, disabled }: { active: boolean; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  const { palette, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.modeCard,
        { borderRadius: radius.md, borderColor: active ? palette.primary : palette.border, backgroundColor: active ? palette.primarySoft : palette.surface },
      ]}
    >
      <Ionicons name={icon} size={20} color={active ? palette.primary : palette.textMuted} />
      <Text style={{ color: active ? palette.primary : palette.textMuted, fontSize: 12.5, fontWeight: '700', marginTop: 6 }}>{label}</Text>
    </Pressable>
  );
}

function Row({ icon, label, children, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode; last?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.listRow, last ? null : { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
      <Ionicons name={icon} size={20} color={palette.primary} />
      <Text style={{ color: palette.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  modeCard: { flex: 1, borderWidth: 1.5, alignItems: 'center', paddingVertical: 12 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, paddingVertical: 13 },
});
