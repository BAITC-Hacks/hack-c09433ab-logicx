// The editor shares the task schema, but does not own the scoring formula.
export const editableTaskFields = [
  ["title", "Название задачи"], ["industry", "Тема"],
  ["context", "Контекст"], ["need", "Потребность"], ["users", "Пользователи"],
  ["dataAvailable", "Доступные данные"], ["constraints", "Ограничения"],
  ["expectedResult", "Ожидаемый результат"], ["successCriteria", "Критерии успеха"],
  ["contact", "Контакт"], ["interactionFormat", "Формат взаимодействия"],
];

export function taskToDraft(task) {
  return Object.fromEntries(editableTaskFields.map(([key]) => [key, typeof task[key] === "string" ? task[key] : ""]));
}

export function validateTaskEdit(draft, confirmed) {
  if (!draft || editableTaskFields.some(([key]) => typeof draft[key] !== "string")) return "Проверьте формат полей карточки.";
  if (!draft.title.trim() || !draft.context.trim()) return "Заполните название и контекст задачи.";
  if (editableTaskFields.some(([key]) => draft[key].length > 5000)) return "В одном поле должно быть не больше 5000 символов.";
  if (!confirmed) return "Подтвердите достоверность описания перед сохранением.";
  return null;
}

export function updatePublishedTask(state, id, draft, confirmed) {
  const error = validateTaskEdit(draft, confirmed);
  if (error) throw new Error(error);
  if (!state.tasks.some((task) => task.id === id)) throw new Error("Задача не найдена. Откройте карточку заново.");
  const fields = Object.fromEntries(editableTaskFields.map(([key]) => [key, draft[key].trim()]));
  return {
    ...state,
    tasks: state.tasks.map((task) => task.id === id ? { ...task, ...fields, confirmed: true, confirmedAt: new Date().toISOString() } : task),
  };
}
