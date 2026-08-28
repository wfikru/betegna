import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/ThemeContext';
import type { AnswerValue, Question } from '../../models/types';
import { Chip } from '../common/Chip';
import { relativeDate, addDaysISO } from '../../utils/format';
import { TIME_SLOTS, TIME_OF_DAY } from '../../constants/status';

/**
 * Renders any questionnaire question type with full a11y labels.
 * Types: single | multi | boolean | text | number | date | time | photos | location
 */
export function QuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  error?: string;
}) {
  const { palette, radius } = useTheme();
  const q = question;

  return (
    <View>
      <Text style={{ color: palette.text, fontSize: 16.5, fontWeight: '700', lineHeight: 22 }}>
        {q.label}
        {q.required ? <Text style={{ color: palette.danger }}> *</Text> : (
          <Text style={{ color: palette.textMuted, fontSize: 12, fontWeight: '500' }}>  (optional)</Text>
        )}
      </Text>
      {q.type === 'photos' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 2 }}>
          <Text style={{ color: palette.accent, backgroundColor: 'rgba(245,158,11,0.12)', fontSize: 10.5, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            RECOMMENDED
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 12, marginLeft: 8 }}>requests with photos get quotes ~2× faster</Text>
        </View>
      ) : q.helpText ? (
        <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{q.helpText}</Text>
      ) : null}

      <View style={{ marginTop: 14 }}>
        {q.type === 'single' ? (
          <View style={styles.wrapChips}>
            {q.options?.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={value === o.value}
                onPress={() => onChange(o.value)}
              />
            ))}
          </View>
        ) : null}

        {q.type === 'multi' ? (
          <View style={styles.wrapChips}>
            {q.options?.map((o) => {
              const arr = Array.isArray(value) ? value : [];
              const selected = arr.includes(o.value);
              return (
                <Chip
                  key={o.value}
                  label={selected ? `✓ ${o.label}` : o.label}
                  selected={selected}
                  onPress={() =>
                    onChange(selected ? arr.filter((v) => v !== o.value) : [...arr, o.value])
                  }
                />
              );
            })}
          </View>
        ) : null}

        {q.type === 'boolean' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="Yes" selected={value === true} onPress={() => onChange(true)} />
            <Chip label="No" selected={value === false} onPress={() => onChange(false)} />
          </View>
        ) : null}

        {q.type === 'text' ? (
          <TextInput
            value={value != null ? String(value) : ''}
            onChangeText={onChange}
            placeholder={q.placeholder ?? 'Type your answer…'}
            placeholderTextColor={palette.textMuted}
            multiline
            style={[styles.textInput, { borderColor: error ? palette.danger : palette.border, color: palette.text, borderRadius: radius.md }]}
          />
        ) : null}

        {q.type === 'number' ? (
          <View style={[styles.numberRow, { borderColor: error ? palette.danger : palette.border, borderRadius: radius.md }]}>
            <StepperBtn
              icon="remove"
              onPress={() => {
                const min = q.min ?? 0;
                const current = value != null && value !== '' ? Number(value) : 1;
                onChange(Math.max(min, current - 1));
              }}
            />
            <TextInput
              value={value != null ? String(value) : ''}
              onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, '') === '' ? undefined : Number(t.replace(/[^0-9.]/g, '')))}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={palette.textMuted}
              style={{ color: palette.text, fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center', paddingVertical: 12 }}
            />
            <StepperBtn
              icon="add"
              onPress={() => {
                const max = q.max ?? 999;
                const current = value != null && value !== '' ? Number(value) : 0;
                onChange(Math.min(max, current + 1));
              }}
            />
            {q.unit ? (
              <Text style={{ color: palette.textMuted, fontSize: 14, marginLeft: 8 }}>{q.unit}</Text>
            ) : null}
          </View>
        ) : null}

        {q.type === 'date' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {[-0, 1, 2, 3, 5, 7, 14].map((d) => {
              const iso = addDaysISO(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => onChange(iso)}
                  style={[
                    styles.dateChip,
                    { borderRadius: radius.md, borderColor: value === iso ? palette.primary : palette.border, backgroundColor: value === iso ? palette.primary : palette.surface },
                  ]}
                >
                  <Text style={{ color: value === iso ? palette.onPrimary : palette.textMuted, fontSize: 11, fontWeight: '700' }}>
                    {d === 0 ? 'TODAY' : d === 1 ? 'TOMORROW' : new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={{ color: value === iso ? palette.onPrimary : palette.text, fontSize: 15, fontWeight: '800', marginTop: 2 }}>
                    {relativeDate(iso)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {q.type === 'time' ? (
          <View style={styles.wrapChips}>
            {TIME_SLOTS.map((s) => (
              <Chip key={s} label={s} selected={value === s} onPress={() => onChange(s)} />
            ))}
            {TIME_OF_DAY.map((s) => (
              <Chip key={s} label={s} selected={value === s} onPress={() => onChange(s)} />
            ))}
          </View>
        ) : null}

        {q.type === 'photos' ? (
          <PhotosAnswer value={value} onChange={onChange} />
        ) : null}

        {q.type === 'location' ? null : null}
      </View>

      {error ? (
        <Text style={{ color: palette.danger, fontSize: 12.5, marginTop: 6 }}>
          <Ionicons name="alert-circle" size={12} color={palette.danger} /> {error}
        </Text>
      ) : null}
    </View>
  );
}

function StepperBtn({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const { palette, radius: r } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase' : 'Decrease'}
      style={({ pressed }) => [
        styles.stepper,
        { borderRadius: r.sm, borderColor: palette.border, backgroundColor: pressed ? palette.primarySoft : palette.surface },
      ]}
    >
      <Ionicons name={icon} size={17} color={palette.primary} />
    </Pressable>
  );
}

function PhotosAnswer({ value, onChange }: { value: AnswerValue; onChange: (v: AnswerValue) => void }) {
  const { palette, radius } = useTheme();
  const urls = Array.isArray(value) ? value : [];
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {urls.map((u, i) => (
          <Pressable key={u} onPress={() => onChange(urls.filter((_, idx) => idx !== i))} style={styles.photoBox}>
            <Text style={{ fontSize: 30 }}>🖼️</Text>
            <Text style={{ color: palette.danger, fontSize: 11, marginTop: 2 }}>Remove</Text>
          </Pressable>
        ))}
        {urls.length < 3 ? (
          <Pressable
            onPress={() => onChange([...urls, `https://picsum.photos/seed/betegna${Date.now()}/600`])}
            style={[styles.photoBox, { borderStyle: 'dashed', borderColor: palette.border, borderRadius: radius.md, backgroundColor: 'transparent' }]}
          >
            <Ionicons name="camera" size={24} color={palette.primary} />
            <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Add photo</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 6 }}>
        {urls.length} of 3 added — photos get you more accurate quotes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap' },
  textInput: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5, minHeight: 84, textAlignVertical: 'top' },
  numberRow: { borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.0)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  dateChip: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, minWidth: 92, alignItems: 'center' },
  photoBox: { width: 92, height: 92, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  stepper: { width: 34, height: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
});
