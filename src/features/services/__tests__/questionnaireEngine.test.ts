import { validateAnswers, summarizeAnswer, validateAnswer } from '../questionnaireEngine';
import type { Question } from '../../../models/types';

const single: Question = {
  id: 'problem',
  type: 'single',
  label: 'What is the problem?',
  required: true,
  options: [
    { value: 'leak', label: 'A leak' },
    { value: 'clog', label: 'A clog' },
  ],
};

const multi: Question = {
  id: 'scope',
  type: 'multi',
  label: 'What should be included?',
  maxSelect: 2,
  options: [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bath', label: 'Bathrooms' },
    { value: 'windows', label: 'Windows' },
  ],
};

const number: Question = { id: 'bedrooms', type: 'number', label: 'Bedrooms?', required: true, min: 0, max: 20 };
const bool: Question = { id: 'pets', type: 'boolean', label: 'Pets?' };
const text: Question = { id: 'details', type: 'text', label: 'Anything else?' };

describe('questionnaire engine', () => {
  it('requires answers for required questions', () => {
    const issues = validateAnswers([single], {});
    expect(issues).toHaveLength(1);
    expect(issues[0]?.questionId).toBe('problem');
  });

  it('accepts optional questions left empty', () => {
    expect(validateAnswers([bool, text], {})).toHaveLength(0);
  });

  it('rejects out-of-range numbers', () => {
    expect(validateAnswer(number, 25)).not.toBeNull();
    expect(validateAnswer(number, -1)).not.toBeNull();
    expect(validateAnswer(number, 3)).toBeNull();
  });

  it('enforces multi-select limits and option membership', () => {
    expect(validateAnswer(multi, ['kitchen', 'bath', 'windows'])).not.toBeNull(); // > maxSelect
    expect(validateAnswer(multi, ['kitchen', 'bath'])).toBeNull();
    expect(validateAnswer(multi, ['kitchen', 'nope'])).not.toBeNull(); // invalid option
  });

  it('rejects invalid single-choice values', () => {
    expect(validateAnswer(single, 'hack')).not.toBeNull();
    expect(validateAnswer(single, 'leak')).toBeNull();
  });

  it('summarizes answers for humans', () => {
    expect(summarizeAnswer(single, 'leak')).toBe('A leak');
    expect(summarizeAnswer(multi, ['kitchen', 'windows'])).toBe('Kitchen, Windows');
    expect(summarizeAnswer(bool, true)).toBe('Yes');
    expect(summarizeAnswer(number, 3)).toBe('3');
    expect(summarizeAnswer(text, undefined)).toBe('—');
  });
});
