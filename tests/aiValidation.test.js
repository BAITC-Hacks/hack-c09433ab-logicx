import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestions, validateSuggestion } from '../src/utils/aiValidation.js';

test('AI whitespace entities are removed from hints, questions and fields', () => {
  assert.equal(validateSuggestion('&#x20;Общественное&nbsp;питание&#32;'), 'Общественное питание');
  assert.equal(validateSuggestion('&#X0020;Кофейня&#160;&#xa0;'), 'Кофейня');
  const result = validateQuestions({
    questions: ['&#x20;Какие данные?', 'Какой результат?&nbsp;', 'Срок?&#32;'],
    extractedFields: { context: '&#x20;Кофейня&nbsp;', industry: '&#32;' },
  });
  assert.deepEqual(result.questions, ['Какие данные?', 'Какой результат?', 'Срок?']);
  assert.deepEqual(result.extractedFields, { context: 'Кофейня', industry: '' });
});

test('entity-only answers are invalid and markup entities stay plain text', () => {
  assert.throws(() => validateSuggestion('&#x20;&nbsp;&#32;'));
  assert.equal(validateSuggestion('&lt;script&gt; &amp;'), '&lt;script&gt; &amp;');
});
