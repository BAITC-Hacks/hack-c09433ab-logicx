export const STATE_KEY = "hackalem_demo_v2";

const validRows = (rows) => Array.isArray(rows) && rows.every((item) => item && typeof item === "object" && typeof item.id === "string");

export function createDemoState(data, legacy, storedTasks = []) {
  const newTasks = data.tasks.map((task) => ({
    ...task,
    dataAvailable: task.dataAvailable ?? task.data ?? "",
    industry: data.drafts.find((draft) => draft.id === task.draftId)?.industry || "Без темы",
  }));
  const tasks = [...storedTasks, ...newTasks.filter((task) => !storedTasks.some((old) => old.id === task.id))];
  const teams = [...data.teams, ...legacy.teams.filter((team) => !data.teams.some((item) => item.id === team.id))];
  const submissions = [...data.responses, ...legacy.submissions]
    .filter((item) => tasks.some((task) => task.id === item.taskId))
    .map((item) => ({ ...item, idea: item.idea ?? item.solutionIdea, plan: Array.isArray(item.plan) ? item.plan.join("\n") : item.plan, status: "pending" }));
  return { tasks, teams, submissions };
}

export function loadDemoState(storage, data, legacy) {
  try {
    const stored = JSON.parse(storage.getItem(STATE_KEY));
    if (stored && [stored.tasks, stored.teams, stored.submissions].every(validRows)) return stored;
  } catch { /* Restore seed data or migrate old tasks if storage is unavailable. */ }
  let oldTasks = [];
  try {
    const stored = JSON.parse(storage.getItem("hackalem_tasks"));
    if (validRows(stored)) oldTasks = stored;
  } catch { /* Invalid legacy JSON must not prevent startup. */ }
  return createDemoState(data, legacy, oldTasks);
}
