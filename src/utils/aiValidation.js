import { editableTaskFields } from "./taskEditing.js";
const keys = new Set(editableTaskFields.map(([key]) => key));
// Decode whitespace only; AI output remains plain text, never HTML.
const cleanText = (value) => value.replace(/&(?:nbsp|#0*(?:32|160)|#x0*(?:20|a0));/gi, " ").trim();
const validText = (value) => typeof value === "string" && value.length <= 5000 && cleanText(value).length > 0;

export function validateQuestions(result) {
  if (!result || !Array.isArray(result.questions) || result.questions.length < 3 || !result.questions.every(validText)) {
    throw new Error("AI должен вернуть минимум три текстовых вопроса. Попробуйте ещё раз.");
  }
  if (!result.extractedFields || typeof result.extractedFields !== "object" || Array.isArray(result.extractedFields)) throw new Error("AI вернул неверный формат карточки.");
  const fields = {};
  for (const [key, value] of Object.entries(result.extractedFields)) {
    if (!keys.has(key)) continue;
    if (typeof value !== "string" || value.length > 5000) throw new Error("AI вернул некорректное поле карточки.");
    fields[key] = cleanText(value);
  }
  return {
    questions: result.questions.map(cleanText),
    extractedFields: fields,
    questionFields: result.questions.map((_, index) => keys.has(result.questionFields?.[index]) ? result.questionFields[index] : ""),
  };
}

export function validateSuggestion(value) {
  if (!validText(value)) throw new Error("AI вернул пустую или некорректную подсказку. Заполните поле вручную или повторите запрос.");
  return cleanText(value);
}
