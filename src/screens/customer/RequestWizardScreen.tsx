import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Chip } from '../../components/common/Chip';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { QuestionField } from '../../components/forms/QuestionField';
import { ProgressBar } from '../../components/common/Card';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { AnswerValue, Frequency, QuestionnaireAnswers, Urgency } from '../../models/types';
import { CATEGORIES, getService, servicesOfCategory } from '../../config/seed/taxonomy';
import { validateAnswer } from '../../features/services/questionnaireEngine';
import { SUBCITIES } from '../../constants/geo';
import { FREQUENCY_LABEL, URGENCY_LABEL } from '../../constants/status';
import { createRequest } from '../../services/requests';
import * as analyticsService from '../../services/analytics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestWizard'>;
type StepKind = 'service' | 'questions' | 'schedule' | 'review';

export default function RequestWizardScreen({ navigation, route }: Props) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const params = route.params;

  const [step, setStep] = useState<StepKind>(params?.serviceId ? 'questions' : 'service');
  const [categoryId, setCategoryId] = useState<string | undefined>(
    params?.serviceId ? getService(params.serviceId)?.categoryId : undefined,
  );
  const [serviceId, setServiceId] = useState<string | undefined>(params?.serviceId);
  const [summary, setSummary] = useState(params?.summaryText ?? '');
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [qIndex, setQIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [urgency, setUrgency] = useState<Urgency>(params?.urgency ?? 'flexible');
  const [frequency, setFrequency] = useState<Frequency>(params?.frequency ?? 'one_time');
  const [preferredDate, setPreferredDate] = useState<string | undefined>();
  const [preferredTime, setPreferredTime] = useState<string | undefined>();
  const [subcity, setSubcity] = useState(params?.subcity ?? user?.homeArea?.subcity ?? 'Bole');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const service = serviceId ? getService(serviceId) : undefined;
  const questions = useMemo(() => service?.questions ?? [], [service]);
  const question = questions[qIndex];

  useEffect(() => {
    analyticsService.analytics.track('service_selected', { serviceId });
  }, [serviceId]);

  const totalSteps = 2 + Math.max(1, questions.length);
  const progress =
    step === 'service' ? 8 : step === 'questions' ? 10 + (qIndex / Math.max(1, questions.length)) * 55 : step === 'schedule' ? 75 : 92;

  const setAnswer = (v: AnswerValue) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: v }));
    setErrors((prev) => ({ ...prev, [question.id]: '' }));
  };

  const nextQuestion = () => {
    if (!question) return;
    const issue = validateAnswer(question, answers[question.id]);
    if (issue) {
      setErrors((prev) => ({ ...prev, [question.id]: issue.message }));
      return;
    }
    if (qIndex === 0) analyticsService.analytics.track('questionnaire_started', { serviceId: serviceId ?? '' });
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      analyticsService.analytics.track('questionnaire_completed', { serviceId: serviceId ?? '' });
      setStep('schedule');
    }
  };

  const submit = async () => {
    if (!user || !serviceId || !service) return;
    setSubmitting(true);
    try {
      const request = await createRequest(user, {
        serviceId,
        summaryText: summary || service.name,
        answers,
        description: summary,
        location: { subcity, city: 'Addis Ababa', address: address || undefined },
        when: { preferredDate, preferredTime, urgency, frequency },
        photos: [],
      });
      navigation.replace('Matching', { requestId: request.id });
    } catch (e) {
      setSubmitting(false);
      console.error('create request failed', e);
    }
  };

  const back = () => {
    if (step === 'questions') {
      if (qIndex > 0) setQIndex(qIndex - 1);
      else if (serviceId && params?.serviceId) navigation.goBack();
      else setStep('service');
    } else if (step === 'schedule') {
      setStep('questions');
      setQIndex(Math.max(0, questions.length - 1));
    } else if (step === 'review') {
      setStep('schedule');
    } else {
      navigation.goBack();
    }
  };

  return (
    <Screen scroll>
      {/* top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <ProgressBar pct={progress} />
          <Text style={{ color: palette.textMuted, fontSize: 11, marginTop: 5, textAlign: 'center' }}>
            {step === 'service' ? t('request.wizard.step.service')
              : step === 'questions' ? t('request.wizard.step.questions')
              : step === 'schedule' ? t('request.wizard.step.schedule')
              : t('request.wizard.step.review')}
            {step === 'questions' && questions.length ? ` · ${qIndex + 1}/${questions.length}` : ''}
          </Text>
        </View>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={22} color={palette.textMuted} />
        </Pressable>
      </View>

      {/* ── STEP: service ── */}
      {step === 'service' ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>{t('request.wizard.pickCategory')}</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                iconNode={<CategoryIcon categoryId={c.id} size="sm" />}
                label={c.name}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(categoryId === c.id ? undefined : c.id)}
              />
            ))}
          </View>
          {categoryId ? (
            <>
              <Text style={[styles.subtitle, { marginTop: 18 }]}>{t('request.wizard.pickService')}</Text>
              {servicesOfCategory(categoryId).map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    setServiceId(s.id);
                    setStep('questions');
                    setQIndex(0);
                  }}
                  style={({ pressed }) => [
                    styles.serviceRow,
                    { borderColor: palette.border, backgroundColor: pressed ? palette.primarySoft : palette.surface },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.text, fontSize: 15.5, fontWeight: '700' }}>{s.name}</Text>
                    <Text style={{ color: palette.textMuted, fontSize: 12.5, marginTop: 2 }}>{s.description}</Text>
                  </View>
                  <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '800' }}>
                    from {s.fromPrice.toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}
        </View>
      ) : null}

      {/* ── STEP: questions ── */}
      {step === 'questions' && question ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>{service?.name}</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>{t('request.wizard.answersTitle')}</Text>
          <View style={{ marginTop: 10 }}>
            <QuestionField
              key={question.id}
              question={question}
              value={answers[question.id]}
              onChange={setAnswer}
              error={errors[question.id]}
            />
          </View>
          <View style={{ height: 14 }} />
          <Button label={t('common.next')} onPress={nextQuestion} size="lg" icon="arrow-forward" />
          {question.required ? null : (
            <Button label={t('common.skip')} variant="ghost" size="sm" onPress={nextQuestion} style={{ marginTop: 8 }} />
          )}
        </View>
      ) : null}

      {/* ── STEP: schedule & location ── */}
      {step === 'schedule' ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>{t('request.wizard.step.schedule')}</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>A few quick picks so pros know when and where to come.</Text>

          <Text style={[styles.fieldLabel, { color: palette.text }]}>{t('request.wizard.when')}</Text>
          <Text style={[styles.hint, { color: palette.textMuted }]}>How soon?</Text>
          <View style={styles.chipsWrap}>
            {(['flexible', 'this_week', 'tomorrow', 'today', 'emergency'] as Urgency[]).map((u) => (
              <Chip key={u} label={URGENCY_LABEL[u]} selected={urgency === u} onPress={() => setUrgency(u)} />
            ))}
          </View>

          <Text style={[styles.hint, { color: palette.textMuted }]}>How often?</Text>
          <View style={styles.chipsWrap}>
            {(['one_time', 'weekly', 'biweekly', 'monthly'] as Frequency[]).map((f) => (
              <Chip key={f} label={FREQUENCY_LABEL[f]} selected={frequency === f} onPress={() => setFrequency(f)} />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: palette.text }]}>{t('request.wizard.where')}</Text>
          <Input label="Address or landmark (optional)" value={address} onChangeText={setAddress} placeholder="e.g. Near Getu Commercial, Bole" />

          <Text style={[styles.hint, { color: palette.textMuted }]}>{t('request.wizard.subcity')}</Text>
          <View style={styles.chipsWrap}>
            {SUBCITIES.map((s) => (
              <Chip key={s.id} label={s.name} selected={subcity === s.name} onPress={() => setSubcity(s.name)} />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: palette.text }]}>Describe it in your own words (optional)</Text>
          <Input value={summary} onChangeText={setSummary} multiline placeholder="e.g. The guest bathroom tap has been leaking for two days…" />

          <View style={{ height: 10 }} />
          <Button label={t('common.next')} onPress={() => setStep('review')} size="lg" icon="arrow-forward" />
        </View>
      ) : null}

      {/* ── STEP: review ── */}
      {step === 'review' ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>{t('request.wizard.step.review')}</Text>
          <ReviewSummary
            palette={palette}
            service={service?.name ?? ''}
            subcity={subcity}
            address={address}
            urgency={URGENCY_LABEL[urgency]}
            frequency={FREQUENCY_LABEL[frequency]}
            answersCount={Object.values(answers).filter((v) => v !== undefined && v !== '').length}
            summary={summary}
          />
          <View style={[styles.note, { backgroundColor: palette.primarySoft, borderRadius: 12 }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={palette.primary} />
            <Text style={{ color: palette.text, fontSize: 13, lineHeight: 19, marginLeft: 10, flex: 1 }}>
              {t('request.wizard.reviewNote')}
            </Text>
          </View>
          <View style={{ height: 8 }} />
          <Button label={t('request.submit')} onPress={submit} loading={submitting} size="lg" />
        </View>
      ) : null}
    </Screen>
  );
}

function ReviewSummary(props: {
  palette: ReturnType<typeof useTheme>['palette'];
  service: string;
  subcity: string;
  address: string;
  urgency: string;
  frequency: string;
  answersCount: number;
  summary: string;
}) {
  const { palette } = useTheme();
  const rows: [string, string][] = [
    ['Service', props.service],
    ['Location', props.address ? `${props.subcity} · ${props.address}` : props.subcity],
    ['When', props.urgency],
    ['Repeat', props.frequency],
    ['Details shared', `${props.answersCount} answers`],
  ];
  return (
    <View style={[styles.reviewCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.reviewRow}>
          <Text style={{ color: palette.textMuted, fontSize: 13.5, width: 110 }}>{k}</Text>
          <Text style={{ color: palette.text, fontSize: 13.5, fontWeight: '600', flex: 1 }}>{v}</Text>
        </View>
      ))}
      {props.summary ? (
        <View style={[styles.reviewRow, { borderTopWidth: 1, borderTopColor: palette.border, marginTop: 8, paddingTop: 10 }]}>
          <Text style={{ color: palette.text, fontSize: 13.5, fontStyle: 'italic', flex: 1 }}>“{props.summary}”</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, marginTop: 6 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  subtitle: { fontSize: 14.5, marginTop: 6, marginBottom: 6, lineHeight: 20 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  fieldLabel: { fontSize: 14.5, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  hint: { fontSize: 12.5, fontWeight: '700', marginTop: 8, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  note: { flexDirection: 'row', alignItems: 'center', padding: 14, marginTop: 16 },
  reviewCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 12 },
  reviewRow: { flexDirection: 'row', paddingVertical: 5 },
});
