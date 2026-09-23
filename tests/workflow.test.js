import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadDemoState, STATE_KEY } from "../src/utils/demoState.js";
import { formatDeadlineDate, safeLink, validateSubmission, updateSubmissionStatus } from "../src/utils/submissions.js";

const data = JSON.parse(readFileSync(new URL("../data/initialData.json", import.meta.url)));
const legacy = JSON.parse(readFileSync(new URL("../src/data/initialData.json", import.meta.url)));
const storage = (entries = {}) => ({ getItem: (key) => entries[key] ?? null });

test("new data has working relations, normalized fields and industries", () => {
  const state = loadDemoState(storage(), data, legacy);
  assert.equal(state.tasks.length, 5);
  assert.equal(state.submissions.length, 5);
  for (const response of state.submissions) {
    assert.ok(state.tasks.some((task) => task.id === response.taskId));
    assert.ok(state.teams.some((team) => team.id === response.teamId));
    assert.equal(typeof response.plan, "string");
    assert.ok(response.idea);
  }
  assert.ok(state.tasks.every((task) => task.dataAvailable && task.industry));
});

test("legacy tasks survive migration together with their responses", () => {
  const state = loadDemoState(storage({ hackalem_tasks: JSON.stringify(legacy.tasks) }), data, legacy);
  assert.equal(state.tasks.length, 10);
  assert.equal(state.submissions.length, 10);
  assert.deepEqual(state.tasks[0], legacy.tasks[0]);
});

test("invalid or inaccessible storage falls back to seed data", () => {
  for (const value of ["broken", "null", "{}", '{"tasks":[null],"teams":[],"submissions":[]}']) {
    assert.equal(loadDemoState(storage({ [STATE_KEY]: value, hackalem_tasks: value }), data, legacy).tasks.length, 5);
  }
  assert.equal(loadDemoState({ getItem() { throw new Error("disabled"); } }, data, legacy).tasks.length, 5);
});

test("multiple teams can be selected; decisions survive reload and can be reversed", () => {
  const state = loadDemoState(storage(), data, legacy);
  const first = state.submissions[0];
  state.submissions.push({ ...first, id: "second", teamId: state.teams[1].id });
  state.submissions = updateSubmissionStatus(state.submissions, first.id, "accepted");
  state.submissions = updateSubmissionStatus(state.submissions, "second", "accepted");
  const restored = loadDemoState(storage({ [STATE_KEY]: JSON.stringify(state) }), data, legacy);
  assert.equal(restored.submissions.filter((item) => item.status === "accepted").length, 2);
  const rejected = updateSubmissionStatus(restored.submissions, first.id, "rejected");
  assert.equal(rejected.find((item) => item.id === first.id).status, "rejected");
  assert.equal(rejected.find((item) => item.id === "second").status, "accepted");
  assert.equal(updateSubmissionStatus(rejected, first.id, "pending")[0].status, "pending");
  assert.deepEqual(updateSubmissionStatus(rejected, first.id, "invalid"), rejected);
});

test("responses require known teams, meaningful input and web links", () => {
  const valid = { teamId: data.teams[0].id, idea: "Идея", plan: "План", deadline: "Неделя", link: "https://example.com/demo" };
  assert.equal(validateSubmission(valid, data.teams), null);
  for (const change of [{ teamId: "unknown" }, { idea: "  " }, { plan: "" }, { deadline: "" }, { link: "javascript:alert(1)" }]) {
    assert.ok(validateSubmission({ ...valid, ...change }, data.teams));
  }
  for (const link of ["javascript:alert(1)", "data:text/html,test", "/relative", "not a url"]) assert.equal(safeLink(link), null);
});

test("deadline values with time are normalized to date-only in the UI", () => {
  assert.equal(formatDeadlineDate("2025-10-12T18:30:00.000Z"), "2025-10-12");
  assert.equal(formatDeadlineDate("2025-10-12 18:30"), "2025-10-12");
  assert.equal(formatDeadlineDate("2025-10-12"), "2025-10-12");
  assert.equal(formatDeadlineDate("Неделя"), "Неделя");
});
