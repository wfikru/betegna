import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StarPicker } from '../../components/common/Rating';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import { submitReview } from '../../services/reviews';
import { getBooking } from '../../services/bookings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewComposer'>;

export default function ReviewComposerScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const booking = await getBooking(route.params.bookingId);
      await submitReview({
        bookingId: route.params.bookingId,
        requestId: booking?.requestId ?? '',
        customerId: user.uid,
        customerName: user.name,
        proId: route.params.proId,
        // single customer-facing rating; dimension fields mirror it for the
        // reputation pipeline & future detailed breakdowns
        overall: rating,
        quality: rating,
        communication: rating,
        professionalism: rating,
        value: rating,
        punctuality: rating,
        text: text.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => navigation.goBack(), 1200);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginTop: 100 }}>
          <Text style={{ fontSize: 54 }}>🎉</Text>
          <Text style={{ color: palette.text, fontSize: 22, fontWeight: '800', marginTop: 16 }}>{t('review.thanks')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={{ color: palette.text, fontSize: 24, fontWeight: '800' }}>{t('review.title')}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14.5, marginTop: 6, marginBottom: 26, lineHeight: 21 }}>
        How was {route.params.proName}?
      </Text>

      <View style={[styles.stars, { borderRadius: 16, borderColor: palette.border, backgroundColor: palette.surface }]}>
        <StarPicker value={rating} onChange={setRating} size={42} />
        <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 8 }}>
          {rating === 5 ? 'Excellent' : rating === 4 ? 'Very good' : rating === 3 ? 'Okay' : rating === 2 ? 'Poor' : 'Very poor'}
        </Text>
      </View>

      <View style={{ height: 6 }} />
      <Input
        label="Anything to add? (optional)"
        value={text}
        onChangeText={setText}
        multiline
        placeholder="A sentence helps other customers a lot!"
      />

      <Button label={t('review.submit')} onPress={submit} loading={busy} disabled={rating < 1} size="lg" />
      <View style={{ height: 10 }} />
      <Button label={t('common.close')} variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stars: { alignItems: 'center', paddingVertical: 22 },
});
