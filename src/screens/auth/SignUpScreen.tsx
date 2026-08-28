import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import { isEmail, passwordIssues } from '../../utils/validation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

/** Customer signup — minimal by design (≤30 seconds, per the product spec). */
export default function SignUpScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (name.trim().length < 2) return setError('Enter your full name');
    if (!isEmail(email)) return setError('Enter a valid email address');
    const issues = passwordIssues(password);
    if (issues.length) return setError(`Password needs: ${issues.join(', ')}`);
    setBusy(true);
    setError(undefined);
    try {
      await signUp({ name: name.trim(), email, password, role: 'customer' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 24 }}>
        <Text style={{ color: palette.primary, fontSize: 15, fontWeight: '700' }}>← {t('common.back')}</Text>
      </Pressable>
      <Text style={{ color: palette.text, fontSize: 28, fontWeight: '800' }}>{t('auth.signup.title')}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 15, marginTop: 6, marginBottom: 28, lineHeight: 21 }}>
        Tell us what you need — we'll match you with trusted professionals.
      </Text>

      <Input label={t('auth.name')} value={name} onChangeText={setName} placeholder="e.g. Sara Alemu" />
      <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 8 chars, 1 number" />

      {error ? <Text style={{ color: palette.danger, fontSize: 13.5, marginBottom: 12 }}>{error}</Text> : null}

      <Button label={t('auth.signUp')} onPress={submit} loading={busy} size="lg" />

      <View style={{ flex: 1, minHeight: 30 }} />
      <View style={styles.footer}>
        <Text style={{ color: palette.textMuted, fontSize: 14 }}>Want to offer services? </Text>
        <Pressable onPress={() => navigation.navigate('ProSignUp')}>
          <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '700' }}>Join as a Pro</Text>
        </Pressable>
      </View>
      <View style={{ height: 8 }} />
      <View style={styles.footer}>
        <Text style={{ color: palette.textMuted, fontSize: 14 }}>{t('auth.haveAccount')} </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '700' }}>{t('auth.signIn')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 6 },
});
