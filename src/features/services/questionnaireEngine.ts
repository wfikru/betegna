/**
 * Questionnaire engine — validation + human-readable summaries for
 * configuration-driven service questionnaires.
 */
import type { AnswerValue, Question, QuestionnaireAnswers, ServiceDefinition } from '../../models/types';

export interface ValidationIssue {
  questionId: string;
  message: string;
}

export function validateAnswer(q: Question, value: AnswerValue): ValidationIssue | null {
  const empty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (q.required && empty) {
    return { questionId: q.id, message: 'Please answer this question' };
  }
  if (empty) return null;

  if (q.type === 'number') {
    const n = Number(value);
    if (isNaN(n)) return { questionId: q.id, message: 'Enter a valid number' };
    if (q.min != null && n < q.min) return { questionId: q.id, message: `Minimum is ${q.min}` };
    if (q.max != null && n > q.max) return { questionId: q.id, message: `Maximum is ${q.max}` };
  }

  if ((q.type === 'single' || q.type === 'multi') && q.options) {
    const valid = new Set(q.options.map((o) => o.value));
    if (q.type === 'single' && !valid.has(String(value))) {
      return { questionId: q.id, message: 'Pick one of the options' };
    }
    if (q.type === 'multi') {
      const arr = Array.isArray(value) ? value : [String(value)];
      if (arr.some((v) => !valid.has(v))) return { questionId: q.id, message: 'Invalid selection' };
      if (q.maxSelect && arr.length > q.maxSelect) {
        return { questionId: q.id, message: `Pick at most ${q.maxSelect}` };
      }
    }
  }

  return null;
}

export function validateAnswers(
  questions: Question[],
  answers: QuestionnaireAnswers,
): ValidationIssue[] {
  return questions
    .map((q) => validateAnswer(q, answers[q.id]))
    .filter((v): v is ValidationIssue => v !== null);
}

function optionLabel(q: Question, value: string): string {
  return q.options?.find((o) => o.value === value)?.label ?? value;
}

/** Human-readable summary rows for a request's answers (used in Request Detail & Lead Detail). */
export interface SummaryRow {
  label: string;
  value: string;
}

export function summarizeAnswer(q: Question, value: AnswerValue): string {
  if (value === undefined || value === '') return '—';
  switch (q.type) {
    case 'single':
      return optionLabel(q, String(value));
    case 'multi': {
      const arr = Array.isArray(value) ? value : [value];
      return arr.map((v) => optionLabel(q, String(v))).join(', ');
    }
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'number':
      return `${value}${q.unit ? ` ${q.unit}` : ''}`;
    case 'photos': {
      const arr = Array.isArray(value) ? value : value ? [String(value)] : [];
      return arr.length ? `${arr.length} photo${arr.length > 1 ? 's' : ''}` : '—';
    }
    default:
      return String(value);
  }
}

export function summarizeServiceAnswers(
  service: ServiceDefinition,
  answers: QuestionnaireAnswers,
): SummaryRow[] {
  return service.questions
    .filter((q) => q.type !== 'photos')
    .map((q) => ({ label: q.label, value: summarizeAnswer(q, answers[q.id]) }));
}

/** Photos attached via the photos question type. */
export function answerPhotos(service: ServiceDefinition, answers: QuestionnaireAnswers): string[] {
  const q = service.questions.find((x) => x.type === 'photos');
  if (!q) return [];
  const v = answers[q.id];
  return Array.isArray(v) ? v : v ? [String(v)] : [];
}
