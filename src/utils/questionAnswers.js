import { editableTaskFields } from "./taskEditing.js";

export function appendQuestionAnswer(task, item) {
  if (!editableTaskFields.some(([key]) => key === item.field) || typeof item.answer !== "string" || !item.answer.trim()) {
    throw new Error("Выберите поле карточки и напишите ответ.");
  }
  const value = [task[item.field].trim(), item.answer.trim()].filter(Boolean).join("\n");
  if (value.length > 5000) throw new Error("После переноса в поле будет больше 5000 символов. Сократите ответ или текст карточки — ваш ответ сохранён.");
  return { ...task, [item.field]: value };
}
