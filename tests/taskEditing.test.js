import test from "node:test";
import assert from "node:assert/strict";
import { taskToDraft, validateTaskEdit, updatePublishedTask } from "../src/utils/taskEditing.js";
import { calculateScore } from "../src/utils/calculateScore.js";
import { loadDemoState, STATE_KEY } from "../src/utils/demoState.js";

const original = { id: "task-a", title: "Заявки", context: "Сотрудники вручную распределяют обращения клиентов.", draftId: "draft-a" };
const createState = () => ({
  tasks: [{ ...original }, { id: "task-b", title: "Другая задача" }],
  teams: [{ id: "team-a", name: "Команда" }],
  submissions: [{ id: "response-a", taskId: "task-a", teamId: "team-a", status: "accepted" }],
});

test("unconfirmed edits and blank required fields cannot be published", () => {
  const state = createState();
  const draft = taskToDraft(original);
  assert.ok(validateTaskEdit(draft, false));
  assert.throws(() => updatePublishedTask(state, original.id, draft, false));
  assert.ok(validateTaskEdit({ ...draft, title: "  " }, true));
  assert.ok(validateTaskEdit({ ...draft, context: "\n" }, true));
  assert.ok(validateTaskEdit({ ...draft, users: {} }, true));
  assert.ok(validateTaskEdit({ ...draft, context: "x".repeat(5001) }, true));
  assert.deepEqual(state.tasks[0], original);
});

test("editing a local draft does not change the published task", () => {
  const state = createState();
  const draft = taskToDraft(state.tasks[0]);
  draft.title = "Несохранённое название";
  assert.equal(state.tasks[0].title, original.title);
});

test("confirmed edits preserve task identity, other tasks, responses and decisions", () => {
  const state = createState();
  const draft = { ...taskToDraft(original), title: "  Обновлённые заявки  ", id: "forged", draftId: "forged" };
  const result = updatePublishedTask(state, original.id, draft, true);
  assert.equal(result.tasks[0].title, "Обновлённые заявки");
  assert.equal(result.tasks[0].id, original.id);
  assert.equal(result.tasks[0].draftId, original.draftId);
  assert.ok(Number.isFinite(Date.parse(result.tasks[0].confirmedAt)));
  assert.equal(result.submissions, state.submissions);
  assert.equal(result.teams, state.teams);
  assert.equal(result.tasks[1], state.tasks[1]);
  assert.equal(state.tasks[0].title, original.title);
});

test("improved task gets recalculated score and survives storage roundtrip", () => {
  const state = createState();
  const draft = { ...taskToDraft(original), expectedResult: "Интерфейс с распределением заявок между менеджерами.", dataAvailable: "Синтетические примеры заявок в CSV", industry: "Автоматизация" };
  const result = updatePublishedTask(state, original.id, draft, true);
  assert.ok(calculateScore(result.tasks[0]).score > calculateScore(original).score);
  const serialized = JSON.stringify(result);
  const reloaded = loadDemoState({ getItem: (key) => key === STATE_KEY ? serialized : null }, {}, {});
  assert.deepEqual(reloaded, result);
  assert.equal(reloaded.submissions[0].status, "accepted");
});

test("low score does not block editing; unknown task is rejected", () => {
  const draft = taskToDraft(original);
  assert.equal(validateTaskEdit(draft, true), null);
  assert.ok(updatePublishedTask(createState(), original.id, draft, true));
  assert.throws(() => updatePublishedTask(createState(), "missing", draft, true), /не найдена/);
});
