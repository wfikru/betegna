import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import { isEmail } from '../../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (!isEmail(email)) return setError('Enter a valid email address');
    if (!password) return setError('Enter your password');
    setBusy(true);
    setError(undefined);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 24 }}>
        <Text style={{ color: palette.primary, fontSize: 15, fontWeight: '700' }}>← {t('common.back')}</Text>
      </Pressable>
      <Text style={{ color: palette.text, fontSize: 28, fontWeight: '800' }}>{t('auth.login.title')}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 15, marginTop: 6, marginBottom: 28 }}>{t('auth.login.subtitle')}</Text>

      <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

      {error ? <Text style={{ color: palette.danger, fontSize: 13.5, marginBottom: 12 }}>{error}</Text> : null}

      <Button label={t('auth.signIn')} onPress={submit} loading={busy} size="lg" />
      <Pressable onPress={() => navigation.navigate('Forgot')} style={{ marginTop: 16, alignSelf: 'center' }} hitSlop={8}>
        <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '600' }}>{t('auth.forgot')}</Text>
      </Pressable>

      <View style={{ height: 28 }} />
      <Button
        label="Explore demo instantly"
        variant="ghost"
        onPress={() => {
          setEmail('demo@betegna.app');
          setPassword('demo1234');
          setTimeout(() => void signIn('demo@betegna.app', 'demo1234'), 150);
        }}
      />
      <View style={{ flex: 1, minHeight: 30 }} />
      <View style={styles.footer}>
        <Text style={{ color: palette.textMuted, fontSize: 14 }}>{t('auth.noAccount')} </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '700' }}>{t('auth.signUp')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 },
});
