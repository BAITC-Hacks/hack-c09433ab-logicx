import { validateQuestions, validateSuggestion } from '../utils/aiValidation.js';

async function requestAi(payload) {
  let response;
  try {
    response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(50000) });
  } catch { throw new Error('AI недоступен или запрос занял слишком долго. Проверьте подключение и повторите.'); }
  let result;
  try { result = await response.json(); } catch { throw new Error('Сервер AI недоступен. Запустите приложение через npm run dev или npm run preview.'); }
  if (!response.ok) throw new Error(result.error || 'Не удалось получить ответ AI.');
  return result;
}
export async function generateClarifyingQuestions(rawDescription) {
  return validateQuestions(await requestAi({ action: 'questions', description: rawDescription }));
}
export async function generateFieldSuggestion(fieldName, currentContext) {
  return validateSuggestion((await requestAi({ action: 'suggestion', field: fieldName, context: currentContext })).suggestedText);
}
