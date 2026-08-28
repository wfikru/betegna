import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { ProgressBar } from '../../components/common/Card';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import type { ProfessionalProfile } from '../../models/types';
import { CATEGORIES, servicesOfCategory } from '../../config/seed/taxonomy';
import { SUBCITIES } from '../../constants/geo';
import { blankProProfile, activateProfessionalAccount, ensureProfessionalProfile } from '../../services/auth';
import { setRoleLanding } from '../../state/roleLanding';
import { saveProProfile } from '../../services/professionals';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProOnboarding'>;
type Step = 'intro' | 'info' | 'services' | 'area' | 'review';

const BENEFITS = [
  { icon: 'flash-outline' as const, title: 'Matched leads, free to view', desc: 'We send you requests that fit your services and area.' },
  { icon: 'chatbubbles-outline' as const, title: 'Chat & quote in minutes', desc: 'Send structured quotes customers accept right in the conversation.' },
  { icon: 'shield-checkmark-outline' as const, title: 'Telebirr escrow payments', desc: 'Money is held securely and released when the job is done.' },
  { icon: 'star-outline' as const, title: 'Reviews build your pipeline', desc: 'Great ratings rank you higher in matching.' },
];

export default function ProOnboardingScreen({ navigation }: Props) {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [busy, setBusy] = useState(false);

  const [businessName, setBusinessName] = useState(user ? `${user.name.split(' ')[0] ?? ''} Services` : '');
  const [about, setAbout] = useState('');
  const [years, setYears] = useState('3');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [services, setServices] = useState<ProfessionalProfile['services']>([]);
  const [serviceArea, setServiceArea] = useState<string[]>([user?.homeArea?.subcity ?? 'Bole']);

  const progress = step === 'intro' ? 10 : step === 'info' ? 35 : step === 'services' ? 60 : step === 'area' ? 85 : 100;

  const toggleCategory = (id: string) => {
    const has = categoryIds.includes(id);
    const next = has ? categoryIds.filter((c) => c !== id) : [...categoryIds, id];
    setCategoryIds(next);
    if (!has) {
      // seed a starter service row from the category's first service
      const svc = servicesOfCategory(id)[0];
      if (svc && !services.some((s) => s.name === svc.name)) {
        setServices((prev) => [...prev, { id: svc.id, name: svc.name, price: svc.fromPrice, unit: svc.priceUnit }]);
      }
    } else {
      const names = new Set(servicesOfCategory(id).map((s) => s.name));
      setServices((prev) => prev.filter((s) => !names.has(s.name)));
    }
  };

  const canContinue = () => {
    if (step === 'info') return businessName.trim().length > 1;
    if (step === 'services') return services.length > 0;
    if (step === 'area') return serviceArea.length > 0;
    return true;
  };

  const activate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const base = (await ensureProfessionalProfile(user)) ?? blankProProfile(user);
      const serviceIds = CATEGORIES.filter((c) => categoryIds.includes(c.id)).flatMap((c) =>
        servicesOfCategory(c.id).map((s) => s.id),
      );
      const profile: ProfessionalProfile = {
        ...base,
        businessName: businessName.trim(),
        about: about.trim() || base.about,
        yearsExperience: Math.max(0, Number(years.replace(/[^0-9]/g, '')) || 1),
        categoryIds,
        serviceIds,
        services,
        serviceArea,
        startingPrice: services.length ? Math.min(...services.map((s) => s.price)) : 0,
      };
      await saveProProfile(profile);
      await activateProfessionalAccount(user, profile);
      setRoleLanding('DashTab'); // consumed if the shell remounts (role changed)…
      // …and if it didn't (signup was already pro), navigate explicitly:
      navigation.navigate('ProTabs', { screen: 'DashTab' });
    } finally {
      setBusy(false);
    }
  };

  const goBackSafe = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ProTabs', { screen: 'DashTab' });
  };

  const back = () => {
    if (step === 'intro') goBackSafe();
    else if (step === 'info') setStep('intro');
    else if (step === 'services') setStep('info');
    else if (step === 'area') setStep('services');
    else setStep('area');
  };

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <ProgressBar pct={progress} />
        </View>
        <Pressable onPress={goBackSafe} hitSlop={10}>
          <Ionicons name="close" size={22} color={palette.textMuted} />
        </Pressable>
      </View>

      {step === 'intro' ? (
        <>
          <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800', lineHeight: 32 }}>Grow your business on Betegna</Text>
          <Text style={{ color: palette.textMuted, fontSize: 14.5, marginTop: 8, marginBottom: 20, lineHeight: 21 }}>
            Set up your professional profile once — takes about 2 minutes. You keep your customer account and can switch modes anytime.
          </Text>
          {BENEFITS.map((b) => (
            <View key={b.title} style={[styles.benefit, { borderRadius: radius.md, borderColor: palette.border, backgroundColor: palette.surface }]}>
              <View style={[styles.benefitIcon, { backgroundColor: palette.primarySoft, borderRadius: 16 }]}>
                <Ionicons name={b.icon} size={18} color={palette.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>{b.title}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>{b.desc}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 10 }} />
          <Button label="Start setup" size="lg" onPress={() => setStep('info')} icon="arrow-forward" />
        </>
      ) : null}

      {step === 'info' ? (
        <>
          <Text style={styles.title}>About your business</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>Customers see this on your profile.</Text>
          <View style={{ height: 8 }} />
          <Field label="Business name" value={businessName} onChange={setBusinessName} palette={palette} radius={radius.md} placeholder="e.g. Abebe Plumbing Works" />
          <Text style={[styles.label, { color: palette.text }]}>Tell customers about you</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            multiline
            placeholder="Your experience, what you do best, areas you serve…"
            placeholderTextColor={palette.textMuted}
            style={[styles.multi, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
          />
          <Field label="Years of experience" value={years} onChange={(v: string) => setYears(v.replace(/[^0-9]/g, ''))} palette={palette} radius={radius.md} placeholder="e.g. 5" />
          <Button label={t_next()} onPress={() => setStep('services')} disabled={!canContinue()} size="lg" />
        </>
      ) : null}

      {step === 'services' ? (
        <>
          <Text style={styles.title}>What do you offer?</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>Pick categories — we add starter services you can price.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} iconNode={<CategoryIcon categoryId={c.id} size="sm" />} label={c.name} selected={categoryIds.includes(c.id)} onPress={() => toggleCategory(c.id)} />
            ))}
          </View>
          {services.length ? (
            <Text style={[styles.label, { marginTop: 10, color: palette.text }]}>Your services & prices (ETB)</Text>
          ) : null}
          {services.map((s, i) => (
            <View key={s.id} style={[styles.lineRow, { borderColor: palette.border, borderRadius: radius.md }]}>
              <TextInput
                value={s.name}
                onChangeText={(v) => setServices((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: v } : x)))}
                style={{ flex: 1, color: palette.text, fontSize: 14 }}
              />
              <TextInput
                value={String(s.price)}
                onChangeText={(v) => setServices((prev) => prev.map((x, idx) => (idx === i ? { ...x, price: Number(v.replace(/[^0-9]/g, '')) || 0 } : x)))}
                keyboardType="number-pad"
                style={{ color: palette.primary, fontSize: 14, fontWeight: '800', width: 76, textAlign: 'right' }}
              />
              <Pressable onPress={() => setServices((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={palette.textMuted} />
              </Pressable>
            </View>
          ))}
          <Button label={t_next()} onPress={() => setStep('area')} disabled={!canContinue()} size="lg" />
        </>
      ) : null}

      {step === 'area' ? (
        <>
          <Text style={styles.title}>Where do you work?</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>You'll only get leads from sub-cities you select.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {SUBCITIES.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                selected={serviceArea.includes(s.name)}
                onPress={() =>
                  setServiceArea((prev) => (prev.includes(s.name) ? prev.filter((x) => x !== s.name) : [...prev, s.name]))
                }
              />
            ))}
          </View>
          <Button label={t_next()} onPress={() => setStep('review')} disabled={!canContinue()} size="lg" />
        </>
      ) : null}

      {step === 'review' ? (
        <>
          <Text style={styles.title}>You're ready 🎉</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>Activate your professional account and start receiving leads.</Text>
          <View style={[styles.reviewCard, { borderRadius: radius.lg, borderColor: palette.border, backgroundColor: palette.surface }]}>
            <Row k="Business" v={businessName} />
            <Row k="Experience" v={`${years || '1'} years`} />
            <Row k="Services" v={`${services.length} service${services.length === 1 ? '' : 's'}`} />
            <Row k="From" v={`${Math.min(...(services.length ? services.map((s) => s.price) : [0])).toLocaleString()} ETB`} />
            <Row k="Service area" v={serviceArea.join(', ')} last />
          </View>
          <Button label="Activate professional mode" size="lg" onPress={activate} loading={busy} icon="checkmark-circle-outline" />
          <View style={{ height: 8 }} />
          <Button label="Not now" variant="ghost" size="sm" onPress={() => navigation.goBack()} />
        </>
      ) : null}
    </Screen>
  );
}

function t_next() {
  return 'Continue';
}

function Row({ k, v, last }: { k: string; v: string; last?: boolean }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.reviewRow, last ? null : { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
      <Text style={{ color: palette.textMuted, fontSize: 13, width: 104 }}>{k}</Text>
      <Text style={{ color: palette.text, fontSize: 13.5, fontWeight: '600', flex: 1 }} numberOfLines={1}>
        {v}
      </Text>
    </View>
  );
}

function Field({ label, value, onChange, palette, radius, placeholder }: { label: string; value: string; onChange: (v: string) => void; palette: ReturnType<typeof useTheme>['palette']; radius: number; placeholder?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        style={[styles.years, { borderColor: palette.border, borderRadius: radius, color: palette.text, width: '100%' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, marginTop: 6 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  subtitle: { fontSize: 14.5, marginTop: 6, lineHeight: 20 },
  label: { fontSize: 13.5, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  benefit: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 12, marginBottom: 10 },
  benefitIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  multi: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, minHeight: 90, textAlignVertical: 'top', fontSize: 14.5 },
  years: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14.5, width: 110 },
  lineRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  reviewCard: { borderWidth: 1, padding: 14, marginTop: 12, marginBottom: 16 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
});
