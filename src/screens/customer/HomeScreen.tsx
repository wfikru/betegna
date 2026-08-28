import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../components/common/Screen';
import { GradientPanel } from '../../components/common/GradientPanel';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { SectionHeader } from '../../components/common/SectionHeader';
import { CategoryCard } from '../../components/cards/CategoryCard';
import { RequestCard } from '../../components/cards/RequestCard';
import { SkeletonList } from '../../components/common/Skeleton';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import { CATEGORIES, SERVICES } from '../../config/seed/taxonomy';
import { parseIntent, searchServices } from '../../features/marketplace/nlParser';
import { getCategory } from '../../config/seed/taxonomy';
import { getLocale } from '../../i18n';
import * as analyticsService from '../../services/analytics';
import type { ServiceRequest } from '../../models/types';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';
import { subscribeRequests } from '../../services/requests';
import { money } from '../../utils/format';



export default function HomeScreen() {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; categoryId: string }[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeRequests(user.uid, setRequests);
  }, [user]);

  useEffect(() => {
    analyticsService.analytics.track('landing');
  }, []);

  const active = useMemo(() => (requests ?? []).filter((r) => r.status !== 'completed' && r.status !== 'cancelled').slice(0, 2), [requests]);

  const startSearch = () => {
    setSuggestions([]);
    analyticsService.analytics.track('search_started', { query });
    const intent = parseIntent(query);
    navigation.navigate('RequestWizard', {
      serviceId: intent.serviceId,
      summaryText: query.trim() || undefined,
      urgency: intent.urgency,
      frequency: intent.frequency,
      subcity: intent.locationHint,
    });
  };

  return (
    <Screen scroll padded={false} style={{ paddingBottom: 104 }}>
      {/* Header */}
      <GradientPanel style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]} bottomRadius={28}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>ሰላም{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</Text>
            <Text style={styles.subGreeting}>What can we get done for you today?</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* NL hero search */}
        <View style={[styles.searchCard, { borderRadius: radius.xl }]}>
          <Ionicons name="search" size={19} color={palette.textMuted} style={{ marginHorizontal: 4 }} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSuggestions(t.trim().length >= 2 ? searchServices(t.trim()).slice(0, 6) : []);
            }}
            onSubmitEditing={startSearch}
            placeholder={t('home.heroPlaceholder')}
            placeholderTextColor={palette.textMuted}
            returnKeyType="go"
            autoCapitalize="none"
            style={{ flex: 1, color: palette.text, fontSize: 15.5, paddingVertical: 12 }}
          />
          <Pressable onPress={startSearch} style={({ pressed }) => [styles.goBtn, { borderRadius: radius.md, backgroundColor: pressed ? palette.primaryDark : palette.primary }]} accessibilityRole="button" accessibilityLabel="Get started">
            <Ionicons name="arrow-forward" size={17} color={palette.onPrimary} />
          </Pressable>
        </View>

        {/* type-ahead service suggestions (taxonomy-driven; Firestore-backed in production) */}
        {suggestions.length ? (
          <View style={[styles.suggestBox, { borderRadius: radius.lg, backgroundColor: palette.surface, borderColor: palette.border }]}>
            {suggestions.map((svc) => {
              const cat = getCategory(svc.categoryId);
              return (
                <Pressable
                  key={svc.id}
                  onPress={() => {
                    setSuggestions([]);
                    setQuery('');
                    navigation.navigate('RequestWizard', { serviceId: svc.id, summaryText: query.trim() || undefined });
                  }}
                  style={({ pressed }) => [styles.suggestRow, { backgroundColor: pressed ? palette.primarySoft : 'transparent' }]}
                  accessibilityRole="button"
                  accessibilityLabel={svc.name}
                >
                  <Text style={{ fontSize: 16 }}>{cat?.emoji ?? '🔧'}</Text>
                  <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '700', marginLeft: 10, flex: 1 }} numberOfLines={1}>
                    {svc.name}
                  </Text>
                  <Text style={{ color: palette.textMuted, fontSize: 12 }}>{cat?.name}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
</GradientPanel>

      <View style={{ padding: 16 }}>
        <Text style={{ color: palette.textMuted, fontSize: 12.5, textAlign: 'center', marginBottom: 18, marginTop: 4 }}>
          {t('home.trust')}
        </Text>

        {active.length ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHeader title={t('home.activeRequests')} actionLabel={t('common.viewAll')} onAction={() => navigation.navigate('RequestsTab')} />
            {active.map((r) => (
              <RequestCard key={r.id} request={r} onPress={() => navigation.navigate('RequestDetail', { requestId: r.id })} />
            ))}
          </View>
        ) : requests === null ? (
          <SkeletonList rows={1} />
        ) : null}


        {/* Categories */}
        <View style={{ height: 12 }} />
        <SectionHeader title={t('home.categories')} icon="grid-outline" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
          {CATEGORIES.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              count={SERVICES.filter((sv) => sv.categoryId === c.id).length}
              onPress={() => navigation.navigate('RequestWizard', { serviceId: SERVICES.find((sv) => sv.categoryId === c.id)?.id }) }
            />
          ))}
        </View>

        {/* How it works */}
        <View style={{ height: 14 }} />
        <SectionHeader title={t('home.howItWorks')} icon="sparkles-outline" />
        <View style={[styles.steps, { borderRadius: radius.lg, backgroundColor: palette.surface, borderColor: palette.border }]}>
          {[
            { n: 1, title: t('home.step1'), desc: t('home.step1desc'), icon: 'pencil-outline' as const },
            { n: 2, title: t('home.step2'), desc: t('home.step2desc'), icon: 'people-outline' as const },
            { n: 3, title: t('home.step3'), desc: t('home.step3desc'), icon: 'checkmark-circle-outline' as const },
          ].map((s, i) => (
            <View key={s.n} style={[styles.step, i < 2 ? { marginBottom: 18 } : null]}>
              <View style={[styles.stepIcon, { backgroundColor: palette.primarySoft }]}>
                <Ionicons name={s.icon} size={19} color={palette.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>{s.title}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Become pro CTA */}
        <View style={[styles.proCta, { borderRadius: radius.lg, backgroundColor: palette.accentSoft }]}>
          <Ionicons name="briefcase-outline" size={22} color={palette.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: palette.text, fontSize: 15.5, fontWeight: '800' }}>{t('home.becomePro')}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
              One account, two modes — switch anytime to grow your business.
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 26, elevation: 10, shadowColor: '#2A2118', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: '#fff', fontSize: 21, fontWeight: '800' },
  subGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, marginTop: 2, marginBottom: 14 },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  searchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  goBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  suggestBox: { marginTop: 8, paddingVertical: 4, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  suggestRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  example: { backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  exampleText: { color: '#fff', fontSize: 12.5 },

  steps: { borderWidth: 1, padding: 18 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  proCta: { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 20, marginBottom: 8 },
});
