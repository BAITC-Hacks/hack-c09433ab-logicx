export const submissionStatuses = { pending: "На рассмотрении", accepted: "Выбрана бизнесом", rejected: "Отклонена" };

export function formatDeadlineDate(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const isoDateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i);
  return isoDateMatch ? isoDateMatch[1] : trimmed;
}

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
