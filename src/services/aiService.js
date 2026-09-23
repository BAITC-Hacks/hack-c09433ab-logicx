// Local demo adapter. Replace internals with the server API when it is connected.
// The public return formats are validated by utils/aiValidation.js.
import { editableTaskFields } from "../utils/taskEditing.js";

export async function generateClarifyingQuestions(rawDescription) {
  if (typeof rawDescription !== "string" || !rawDescription.trim()) throw new Error("Опишите бизнес-задачу.");
  const text = rawDescription.trim();
  const questions = [
    ["users", "Кто будет пользоваться решением?", /пользовател|аудитор|для студентов|для сотрудников/i],
    ["dataAvailable", "Какие данные и примеры доступны команде?", /данные|csv|json|excel|история заказов/i],
    ["successCriteria", "По каким измеримым признакам вы примете результат?", /критери|не менее|не более|%/i],
    ["constraints", "Какие сроки, доступы и технические ограничения нужно учесть?", /ограничени|срок|недел|месяц/i],
    ["expectedResult", "Что именно команда должна передать в конце работы?", /результат|передать|на выходе/i],
    ["contact", "Как команда сможет связаться с представителем бизнеса?", /@|телефон|контакт/i],
    ["interactionFormat", "Как будут проходить консультации и обратная связь?", /консультаци|встреч|обратная связь/i],
    ["need", "Что нужно изменить в текущем процессе?", /необходимо|нужно|хотим/i],
  ];
  const chosen = questions.filter(([, , pattern]) => !pattern.test(text)).slice(0, 3);
  const extras = [
    ["constraints", "Какие риски или зависимости ещё нужно учесть?"],
    ["successCriteria", "Как вы проверите результат на конкретном примере?"],
    ["interactionFormat", "Кто согласует итоговую работу команды?"],
  ];
  for (const extra of extras) if (chosen.length < 3) chosen.push(extra);
  return {
    questions: chosen.map(([, question]) => question),
    questionFields: chosen.map(([field]) => field),
    extractedFields: { title: text.length > 80 ? text.slice(0, 77) + "…" : text, context: text },
  };
}

export async function generateFieldSuggestion(fieldName, currentContext) {
  const field = editableTaskFields.find(([key]) => key === fieldName);
  if (!field) throw new Error("Неизвестное поле карточки.");
  const supplied = currentContext?.[fieldName];
  if (typeof supplied === "string" && supplied.trim()) return supplied.trim();
  throw new Error(`Демо-режим: для поля «${field[1]}» пока нет подтверждённых сведений. Заполните его вручную; генерация будет доступна после подключения AI API.`);
}
