import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { SectionHeader } from '../../components/common/SectionHeader';
import { Toggle } from '../../components/common/Toggle';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { ProfessionalProfile } from '../../models/types';
import { getPro, saveProProfile } from '../../services/professionals';
import { useToast } from '../../state/ToastContext';
import { CATEGORIES } from '../../config/seed/taxonomy';
import { SUBCITIES } from '../../constants/geo';
import { PRICE_UNIT_LABEL } from '../../config/brand';
import type { PriceUnit } from '../../config/brand';
import { WEEKDAYS } from '../../constants/status';
import type { Availability, DayWindow } from '../../models/types';

export default function ProProfileEditScreen() {
  const { palette, radius } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState<Record<number, DayWindow>>({});
  const [hoursSaved, setHoursSaved] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    void getPro(user.uid).then((p) => {
      if (!p) return;
      setProfile(p);
      setHours(p.availability.workingHours ?? {});
    });
  }, [user]);

  if (!profile) {
    return (
      <Screen>
        <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: 120 }}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  const patch = (p: Partial<ProfessionalProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...p } : prev));
    setSaved(false);
  };

  const save = async () => {
    if (!profile) return;
    await saveProProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const setDay = (day: number, patch: Partial<DayWindow>) => {
    setHours((prev) => ({
      ...prev,
      [day]: { enabled: prev[day]?.enabled ?? false, start: prev[day]?.start ?? '09:00', end: prev[day]?.end ?? '18:00', ...patch },
    }));
    setHoursSaved(false);
  };
  const saveHours = async () => {
    if (!profile) return;
    const availability: Availability = { ...profile.availability, workingHours: hours };
    await saveProProfile({ ...profile, availability });
    setProfile({ ...profile, availability });
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2200);
  };

  const toggleCategory = (id: string) => {
    const has = profile.categoryIds.includes(id);
    patch({ categoryIds: has ? profile.categoryIds.filter((c) => c !== id) : [...profile.categoryIds, id] });
  };

  const toggleArea = (name: string) => {
    const has = profile.serviceArea.includes(name);
    patch({ serviceArea: has ? profile.serviceArea.filter((s) => s !== name) : [...profile.serviceArea, name] });
  };

  return (
    <Screen scroll>
      <PageHeader title="Professional profile" fallbackTab="DashTab" />
      <Text style={{ color: palette.text, fontSize: 24, fontWeight: '800' }}>Your professional profile</Text>
      <Text style={{ color: palette.textMuted, fontSize: 13.5, marginTop: 4, marginBottom: 16, lineHeight: 19 }}>
        This is what customers see. Complete profiles win up to 3× more jobs.
      </Text>

      <SectionHeader title="Business info" icon="business-outline" />
      <Card>
        <Field label="Business name" value={profile.businessName} onChange={(v) => patch({ businessName: v })} palette={palette} />
        <Field label="Display name" value={profile.displayName} onChange={(v) => patch({ displayName: v })} palette={palette} />
        <Field
          label="About you"
          value={profile.about}
          onChange={(v) => patch({ about: v })}
          multiline
          placeholder="Tell customers who you are, your experience and what makes you great…"
          palette={palette}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Years of experience</Text>
            <TextInput
              value={String(profile.yearsExperience)}
              onChangeText={(v) => patch({ yearsExperience: Number(v.replace(/[^0-9]/g, '')) || 0 })}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Starting price (ETB)</Text>
            <TextInput
              value={String(profile.startingPrice)}
              onChangeText={(v) => patch({ startingPrice: Number(v.replace(/[^0-9]/g, '')) || 0 })}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: palette.border, borderRadius: radius.md, color: palette.text }]}
            />
          </View>
        </View>
      </Card>

      <View style={{ height: 6 }} />
      <SectionHeader title="Categories" icon="grid-outline" />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} iconNode={<CategoryIcon categoryId={c.id} size="sm" />} label={c.name} selected={profile.categoryIds.includes(c.id)} onPress={() => toggleCategory(c.id)} />
          ))}
        </View>
      </Card>

      <View style={{ height: 6 }} />
      <SectionHeader title={t('pro.serviceArea')} icon="map-outline" />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {SUBCITIES.map((s) => (
            <Chip key={s.id} label={s.name} selected={profile.serviceArea.includes(s.name)} onPress={() => toggleArea(s.name)} />
          ))}
        </View>
      </Card>

      <View style={{ height: 6 }} />
      <SectionHeader title={t('pro.services')} icon="pricetag-outline" />
      <Card>
        {profile.services.map((s, i) => (
          <View key={s.id} style={[styles.serviceRow, i < profile.services.length - 1 ? { borderBottomWidth: 1, borderBottomColor: palette.border } : null]}>
            <TextInput
              value={s.name}
              onChangeText={(v) => patch({ services: profile.services.map((x, idx) => (idx === i ? { ...x, name: v } : x)) })}
              style={{ color: palette.text, fontSize: 14, flex: 1 }}
            />
            <TextInput
              value={String(s.price)}
              onChangeText={(v) => patch({ services: profile.services.map((x, idx) => (idx === i ? { ...x, price: Number(v.replace(/[^0-9]/g, '')) || 0 } : x)) })}
              keyboardType="number-pad"
              style={{ color: palette.primary, fontSize: 14, fontWeight: '800', width: 70, textAlign: 'right' }}
            />
            <Text style={{ color: palette.textMuted, fontSize: 11, width: 40 }}>{PRICE_UNIT_LABEL[s.unit as PriceUnit] ?? ''}</Text>
            <Pressable onPress={() => patch({ services: profile.services.filter((_, idx) => idx !== i) })} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={palette.textMuted} />
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() =>
            patch({
              services: [...profile.services, { id: Math.random().toString(36).slice(2), name: 'New service', price: 500, unit: 'visit' }],
            })
          }
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
        >
          <Ionicons name="add-circle-outline" size={17} color={palette.primary} />
          <Text style={{ color: palette.primary, fontSize: 13.5, fontWeight: '700', marginLeft: 6 }}>{t('pro.addService')}</Text>
        </Pressable>
      </Card>

      <View style={{ height: 6 }} />
      <SectionHeader title={t('pro.portfolio')} icon="images-outline" />
      <Card>
        {profile.portfolio.map((p) => (
          <View key={p.id} style={styles.serviceRow}>
            <Text style={{ color: palette.text, fontSize: 14, flex: 1 }} numberOfLines={1}>
              🖼️ {p.title}
            </Text>
            <Pressable onPress={() => patch({ portfolio: profile.portfolio.filter((x) => x.id !== p.id) })} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={palette.textMuted} />
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() =>
            patch({
              portfolio: [
                ...profile.portfolio,
                {
                  id: Math.random().toString(36).slice(2),
                  title: `Project #${profile.portfolio.length + 1}`,
                  imageURL: `https://picsum.photos/seed/pro${Date.now()}/600`,
                },
              ],
            })
          }
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
        >
          <Ionicons name="add-circle-outline" size={17} color={palette.primary} />
          <Text style={{ color: palette.primary, fontSize: 13.5, fontWeight: '700', marginLeft: 6 }}>Add portfolio photo</Text>
        </Pressable>
      </Card>

      <View style={{ height: 12 }} />
      <Button label={saved ? '✓ Saved' : t('common.save')} onPress={save} variant={saved ? 'secondary' : 'primary'} />

      <View style={{ height: 6 }} />
      <SectionHeader title={t('pro.workingHours')} icon="time-outline" />
      <Card>
        {WEEKDAYS.map((d, i) => {
          const w = hours[i];
          return (
            <View key={d} style={[styles.dayRow, i < 6 ? { borderBottomWidth: 1, borderBottomColor: palette.border } : null]}>
              <Text style={{ color: palette.text, fontSize: 14.5, fontWeight: '600', width: 44 }}>{d}</Text>
              <View style={{ flex: 1 }}>
                <Toggle value={w?.enabled ?? false} onValueChange={(v) => setDay(i, { enabled: v })} label={w?.enabled ? 'Working' : 'Off'} />
              </View>
              {w?.enabled ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TimeBtn value={w.start} onChange={(v) => setDay(i, { start: v })} />
                  <Text style={{ color: palette.textMuted, marginHorizontal: 6 }}>–</Text>
                  <TimeBtn value={w.end} onChange={(v) => setDay(i, { end: v })} />
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={{ height: 10 }} />
        <Button label={hoursSaved ? '✓ Hours saved' : 'Save working hours'} onPress={saveHours} variant={hoursSaved ? 'secondary' : 'primary'} icon="time-outline" />
      </Card>
      <View style={{ height: 16 }} />
      {!profile.verified ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={palette.accent} />
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: '700', marginLeft: 10, flex: 1 }}>{t('pro.verifyNote')}</Text>
          </View>
          <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 6, lineHeight: 18 }}>
            Upload your trade license or ID from Profile → Verification (document review runs in the admin portal).
          </Text>
        </Card>
      ) : null}
      <View style={{ height: 10 }} />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  palette,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  const { radius } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        style={[
          styles.input,
          { borderColor: palette.border, borderRadius: radius.md, color: palette.text },
          multiline ? { minHeight: 80, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

function TimeBtn({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { palette, radius } = useTheme();
  return (
    <Pressable
      onPress={() => {
        const [h, m] = value.split(':').map(Number);
        onChange(`${String(((h ?? 9) + 1) % 24).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`);
      }}
      style={[timeStyles.btn, { borderRadius: radius.sm, borderColor: palette.border, backgroundColor: palette.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`Change time from ${value}`}
    >
      <Text style={{ color: palette.text, fontSize: 13, fontWeight: '700' }}>{value}</Text>
    </Pressable>
  );
}

const timeStyles = StyleSheet.create({ btn: { borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 5 } });

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
  input: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14.5 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
});
