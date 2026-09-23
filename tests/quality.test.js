import test from "node:test";
import assert from "node:assert/strict";
import { calculateScore, scoreToLevel } from "../src/utils/calculateScore.js";
import { validateQuestions, validateSuggestion } from "../src/utils/aiValidation.js";
import { generateClarifyingQuestions, generateFieldSuggestion } from "../src/services/aiService.js";

const fields = ["context", "need", "dataAvailable", "expectedResult", "successCriteria", "constraints", "users", "contact", "interactionFormat"];
test("score boundaries match the specification", () => {
  for (const [score, label] of [[0,"Черновик"],[39,"Черновик"],[40,"Рабочая"],[69,"Рабочая"],[70,"Готовая"],[89,"Готовая"],[90,"Приоритетная"],[100,"Приоритетная"]]) assert.equal(scoreToLevel(score).label, label);
});
test("placeholders give no points; complete fields total 100 and title has no weight", () => {
  for (const value of ["", "   ", "-", "???", "нет", "n/a", "x".repeat(200), {}, null]) {
    const result = calculateScore(Object.fromEntries(fields.map((key) => [key, value])));
    assert.equal(result.score, 0);
    assert.equal(result.missingFields.length, 9);
  }
  assert.equal(calculateScore({ title: "Название задачи" }).score, 0);
  const complete = calculateScore(Object.fromEntries(fields.map((key) => [key, "Подтверждённые сведения о задаче"])));
  assert.equal(complete.score, 100);
  assert.equal(Object.values(complete.breakdown).reduce((sum, item) => sum + item.points, 0), 100);
});
test("AI response validation rejects malformed questions and fields", () => {
  for (const value of [null, {}, { questions: ["a", "b"], extractedFields: {} }, { questions: ["a", {}, "c"], extractedFields: {} }, { questions: ["a", "b", "c"], extractedFields: { title: {} } }]) assert.throws(() => validateQuestions(value));
  for (const value of [null, {}, "  ", "x".repeat(5001)]) assert.throws(() => validateSuggestion(value));
  const result = validateQuestions({ questions: ["a", "b", "c"], extractedFields: { title: " Задача ", unknown: 123 }, questionFields: ["users", "unknown", "contact"] });
  assert.deepEqual(result.extractedFields, { title: "Задача" });
  assert.deepEqual(result.questionFields, ["users", "", "contact"]);
});
test("demo asks about missing information and only extracts the user's text", async () => {
  const raw = "Система для сотрудников, данные CSV, срок две недели";
  const result = validateQuestions(await generateClarifyingQuestions(raw));
  assert.equal(result.questions.length, 3);
  assert.equal(result.extractedFields.context, raw);
  assert.ok(!result.questionFields.includes("users"));
  assert.ok(!result.questionFields.includes("dataAvailable"));
  assert.ok(!result.questionFields.includes("constraints"));
  const full = validateQuestions(await generateClarifyingQuestions("пользователи данные критерии сроки результат контакт встречи нужно"));
  assert.equal(full.questions.length, 3);
});
test("demo hints never invent unknown contacts or audiences", async () => {
  await assert.rejects(generateFieldSuggestion("contact", { context: "Кофейня" }), /нет подтверждённых/);
  await assert.rejects(generateFieldSuggestion("users", { context: "Кофейня" }), /нет подтверждённых/);
  await assert.rejects(generateFieldSuggestion("unknown", {}), /Неизвестное/);
  assert.equal(await generateFieldSuggestion("users", { users: "Бариста" }), "Бариста");
});
