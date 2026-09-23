export const submissionStatuses = { pending: "На рассмотрении", accepted: "Выбрана бизнесом", rejected: "Отклонена" };

export function safeLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function validateSubmission(value, teams) {
  if (!teams.some((team) => team.id === value.teamId)) return "Выберите команду.";
  if (![value.idea, value.plan, value.deadline].every((text) => typeof text === "string" && text.trim())) return "Заполните идею решения, план и срок.";
  if (!safeLink(value.link)) return "Укажите полную ссылку на прототип: https://…";
  return null;
}

export function updateSubmissionStatus(submissions, id, status) {
  if (!Object.hasOwn(submissionStatuses, status)) return submissions;
  return submissions.map((item) => item.id === id ? { ...item, status } : item);
}
