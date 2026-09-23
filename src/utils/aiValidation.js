import { editableTaskFields } from "./taskEditing.js";
const keys = new Set(editableTaskFields.map(([key]) => key));
const validText = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 5000;

export function validateQuestions(result) {
  if (!result || !Array.isArray(result.questions) || result.questions.length < 3 || !result.questions.every(validText)) {
    throw new Error("AI должен вернуть минимум три текстовых вопроса. Попробуйте ещё раз.");
  }
  if (!result.extractedFields || typeof result.extractedFields !== "object" || Array.isArray(result.extractedFields)) throw new Error("AI вернул неверный формат карточки.");
  const fields = {};
  for (const [key, value] of Object.entries(result.extractedFields)) {
    if (!keys.has(key)) continue;
    if (typeof value !== "string" || value.length > 5000) throw new Error("AI вернул некорректное поле карточки.");
    fields[key] = value.trim();
  }
  return {
    questions: result.questions.map((value) => value.trim()),
    extractedFields: fields,
    questionFields: result.questions.map((_, index) => keys.has(result.questionFields?.[index]) ? result.questionFields[index] : ""),
  };
}

export function validateSuggestion(value) {
  if (!validText(value)) throw new Error("AI вернул пустую или некорректную подсказку. Заполните поле вручную или повторите запрос.");
  return value.trim();
}
