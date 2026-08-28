import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../state/ThemeContext';
import { t } from '../../i18n';
import { BRAND } from '../../config/brand';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  return (
    <Screen scroll padded={false}>
      <View style={[styles.hero, { backgroundColor: palette.primary }]}>
        <View style={styles.logoRow}>
          <View style={styles.mark}>
            <Text style={{ fontSize: 26 }}>🏡</Text>
          </View>
          <View>
            <Text style={styles.brand}>{BRAND.name}</Text>
            <Text style={styles.brandAm}>{BRAND.nameAm}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{t('auth.welcome.title')}</Text>
        <Text style={styles.heroSub}>{t('auth.welcome.subtitle')}</Text>
      </View>

      <View style={styles.body}>
        <Pressable
          style={[styles.modeCard, { borderColor: palette.primary, backgroundColor: palette.primarySoft }]}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Ionicons name="search" size={22} color={palette.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>{t('auth.welcome.customer')}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 2 }}>
              Tell us what you need — we match you with trusted pros.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.primary} />
        </Pressable>

        <Pressable
          style={[styles.modeCard, { borderColor: palette.border }]}
          onPress={() => navigation.navigate('ProSignUp')}
        >
          <Ionicons name="briefcase" size={22} color={palette.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>{t('auth.welcome.pro')}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 2 }}>
              Quick signup — set up services, prices & your area right after.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
        </Pressable>

        <View style={{ height: 12 }} />
        <Button
          label={t('auth.signIn')}
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
        />
        <View style={{ height: 24 }} />
        <Text style={{ color: palette.textMuted, fontSize: 12.5, textAlign: 'center', lineHeight: 18 }}>
          Demo mode is ON — sign in with any email (e.g. demo@betegna.app) to explore instantly. No password needed.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 44, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  mark: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800' },
  brandAm: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  heroSub: { color: 'rgba(255,255,255,0.88)', fontSize: 15, marginTop: 10, lineHeight: 22 },
  body: { padding: 20 },
  modeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 12 },
});
