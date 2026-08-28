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

type Props = NativeStackScreenProps<RootStackParamList, 'Forgot'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (!isEmail(email)) return setError('Enter a valid email address');
    setBusy(true);
    setError(undefined);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send reset email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 24 }}>
        <Text style={{ color: palette.primary, fontSize: 15, fontWeight: '700' }}>← {t('common.back')}</Text>
      </Pressable>
      <Text style={{ color: palette.text, fontSize: 28, fontWeight: '800' }}>{t('auth.forgotTitle')}</Text>
      {sent ? (
        <Text style={{ color: palette.success, fontSize: 15, marginTop: 12, lineHeight: 22 }}>
          If an account exists for {email}, a reset link is on its way. Check your inbox.
        </Text>
      ) : (
        <>
          <Text style={{ color: palette.textMuted, fontSize: 15, marginTop: 6, marginBottom: 28, lineHeight: 21 }}>
            Enter your email and we will send you a reset link.
          </Text>
          <Input label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
          {error ? <Text style={{ color: palette.danger, fontSize: 13.5, marginBottom: 12 }}>{error}</Text> : null}
          <Button label={t('auth.sendReset')} onPress={submit} loading={busy} size="lg" />
        </>
      )}
      <View style={{ flex: 1, minHeight: 40 }} />
      <Button label={t('auth.signIn')} variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
