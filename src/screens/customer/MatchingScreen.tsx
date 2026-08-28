import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../state/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { getRequest } from '../../services/requests';
import type { ServiceRequest } from '../../models/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Matching'>;

const STAGES = [
  'Understanding your request…',
  'Scanning professionals near you…',
  'Checking availability & ratings…',
  'Notifying the best matches…',
];

export default function MatchingScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const [stage, setStage] = useState(0);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = route.params?.requestId;
    if (!id) return;
    const timer = setInterval(() => {
      void getRequest(id).then((r) => r && setRequest(r));
    }, 1200);
    return () => clearInterval(timer);
  }, [route.params]);

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: false })).start();
    const st = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900);
    const done = setTimeout(() => {
      if (route.params?.requestId) {
        navigation.replace('RequestDetail', { requestId: route.params.requestId });
      }
    }, 4000);
    return () => {
      clearInterval(st);
      clearTimeout(done);
    };
  }, [navigation, route.params, spin]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: false }).start();
  }, [fade]);

  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.orb, { borderColor: palette.primary, transform: [{ rotate: rot }] }]}>
          <View style={[styles.orbInner, { backgroundColor: palette.primary }]}>
            <Text style={{ fontSize: 34 }}>🔎</Text>
          </View>
        </Animated.View>

        <Text style={{ color: palette.text, fontSize: 24, fontWeight: '800', marginTop: 30, textAlign: 'center' }}>
          {t('request.submitting')}
        </Text>

        <View style={{ marginTop: 18, alignItems: 'center', minHeight: 60, justifyContent: 'center' }}>
          {STAGES.map((s, i) => (
            <Animated.Text
              key={s}
              style={{
                color: i === stage ? palette.primary : palette.textMuted,
                fontSize: 14.5,
                fontWeight: i === stage ? '700' : '500',
                opacity: i <= stage ? fade : 0.25,
                paddingVertical: 3,
              }}
            >
              {i === stage ? '› ' : i < stage ? '✓ ' : '  '}
              {s}
            </Animated.Text>
          ))}
        </View>

        {request?.matchedProIds.length ? (
          <View style={[styles.matchPill, { backgroundColor: palette.primarySoft }]}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={{ color: palette.primary, fontWeight: '800', marginLeft: 8 }}>
              {request.matchedProIds.length} professionals notified
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

import { t } from '../../i18n';

const styles = StyleSheet.create({
  orb: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderTopColor: 'transparent', borderLeftColor: 'transparent' },
  orbInner: { flex: 1, borderRadius: 51, alignItems: 'center', justifyContent: 'center', margin: 4 },
  matchPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 24 },
});
