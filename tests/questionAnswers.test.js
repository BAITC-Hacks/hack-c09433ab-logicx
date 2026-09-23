import test from "node:test";
import assert from "node:assert/strict";
import { appendQuestionAnswer } from "../src/utils/questionAnswers.js";
import { taskToDraft } from "../src/utils/taskEditing.js";

test("answers append without changing the published draft or losing earlier text", () => {
  const task = { ...taskToDraft({}), context: "Первый факт" };
  const result = appendQuestionAnswer(task, { field: "context", answer: " Второй факт " });
  assert.equal(result.context, "Первый факт\nВторой факт");
  assert.equal(task.context, "Первый факт");
});
test("oversized append is rejected without losing answer or changing task", () => {
  const task = { ...taskToDraft({}), context: "x".repeat(4998) };
  const answer = { field: "context", answer: "abc" };
  assert.throws(() => appendQuestionAnswer(task, answer), /5000/);
  assert.equal(task.context.length, 4998);
  assert.equal(answer.answer, "abc");
  assert.equal(appendQuestionAnswer(task, { field: "context", answer: "a" }).context.length, 5000);
});
test("unknown fields and blank answers cannot be applied", () => {
  assert.throws(() => appendQuestionAnswer(taskToDraft({}), { field: "id", answer: "changed" }));
  assert.throws(() => appendQuestionAnswer(taskToDraft({}), { field: "context", answer: " " }));
});
