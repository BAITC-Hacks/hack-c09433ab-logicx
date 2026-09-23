import { useEffect, useRef, useState } from "react";
import { generateClarifyingQuestions, generateFieldSuggestion } from "../services/aiService.js";
import { editableTaskFields, taskToDraft, validateTaskEdit } from "../utils/taskEditing.js";
import { validateQuestions, validateSuggestion } from "../utils/aiValidation.js";
import ScoreBreakdown from "./ScoreBreakdown.jsx";
import { appendQuestionAnswer } from "../utils/questionAnswers.js";

export default function TaskForm({ onSubmit }) {
  const [task, setTask] = useState(() => taskToDraft({}));
  const [rawIdea, setRawIdea] = useState("");
  const [questions, setQuestions] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const request = useRef(0);
  const pending = useRef(false);
  useEffect(() => () => { request.current += 1; }, []);

  function updateField(key, value) {
    setTask((previous) => ({ ...previous, [key]: value }));
    setConfirmed(false);
    setError("");
  }

  async function runRequest(label, operation, apply) {
    if (pending.current) return;
    pending.current = true;
    const id = ++request.current;
    setBusy(label);
    setConfirmed(false);
    setError("");
    try {
      const result = await operation();
      if (id !== request.current) return;
      apply(result);
      setConfirmed(false);
    } catch (err) {
      if (id === request.current) setError(err.message || "Не удалось получить ответ.");
    } finally {
      if (id === request.current) { pending.current = false; setBusy(""); }
    }
  }

  function generate() {
    if (questions.some((item) => item.answer.trim())) {
      setError("Сначала перенесите ответы в карточку или очистите их. Повторное уточнение заменит вопросы.");
      return;
    }
    if (!rawIdea.trim()) { setError("Сначала опишите бизнес-задачу."); return; }
    runRequest("questions", async () => validateQuestions(await generateClarifyingQuestions(rawIdea.trim())), (result) => {
      setQuestions(result.questions.map((text, index) => ({ text, answer: "", field: result.questionFields?.[index] || "" })));
      setTask((previous) => {
        const next = { ...previous };
        for (const [key, value] of Object.entries(result.extractedFields)) {
          if (Object.hasOwn(next, key) && !next[key].trim()) next[key] = value;
        }
        return next;
      });
    });
  }

  function hint(key) {
    runRequest(key, async () => validateSuggestion(await generateFieldSuggestion(key, task)), (suggestion) => {
      setTask((previous) => previous[key].trim() ? previous : { ...previous, [key]: suggestion });
    });
  }

  function answer(index, patch) {
    setQuestions((previous) => previous.map((item, i) => i === index ? { ...item, ...patch } : item));
    setConfirmed(false);
  }

  function applyAnswer(item) {
    try {
      setTask(appendQuestionAnswer(task, item));
    } catch (err) {
      setError(err.message);
      return;
    }
    setQuestions((previous) => previous.map((entry) => entry === item ? { ...entry, answer: "" } : entry));
    setConfirmed(false);
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    if (pending.current) { setError("Дождитесь завершения запроса."); return; }
    if (questions.some((item) => item.answer.trim())) { setError("Перенесите ответы в карточку или очистите их перед публикацией."); return; }
    const validation = validateTaskEdit(task, confirmed);
    if (validation) { setError(validation); return; }
    onSubmit({ ...Object.fromEntries(Object.entries(task).map(([key, value]) => [key, value.trim()])), confirmed: true, confirmedAt: new Date().toISOString() });
    request.current += 1;
    setTask(taskToDraft({})); setRawIdea(""); setQuestions([]); setConfirmed(false); setError("");
  }

  return <form onSubmit={submit} className="bg-white border border-line rounded-lg p-6 space-y-5">
    <h2 className="font-display text-2xl text-ink">Новая задача</h2>
    <div className="rounded-xl border border-dashed border-signal/60 bg-signal/5 p-3 space-y-3">
      <h3 className="text-sm font-medium">Smart Builder · AI</h3>
      <p className="text-xs text-ink/60">AI уточняет задачу и помогает сформулировать карточку. Проверьте сведения перед публикацией.</p>
      <label className="block text-sm">Краткая идея
        <textarea value={rawIdea} disabled={Boolean(busy)} maxLength={5000} onChange={(e) => { setRawIdea(e.target.value); setConfirmed(false); }} rows={3} className="mt-1 w-full rounded border border-line p-2" />
      </label>
      <button type="button" disabled={Boolean(busy) || !rawIdea.trim()} onClick={generate} className="rounded bg-signal px-3 py-2 text-sm text-white disabled:opacity-50">{busy === "questions" ? "Анализирую…" : "Уточнить идею"}</button>
      {questions.map((item, index) => <div key={index} className="rounded border border-line bg-white p-3 space-y-2">
        <label className="block text-sm">{index + 1}. {item.text}
          <textarea rows={2} disabled={busy === "questions"} maxLength={5000} value={item.answer} onChange={(e) => answer(index, { answer: e.target.value })} className="mt-1 w-full rounded border border-line p-2" />
        </label>
        <label className="block text-xs">Куда перенести ответ
          <select disabled={busy === "questions"} value={item.field} onChange={(e) => answer(index, { field: e.target.value })} className="mt-1 w-full rounded border border-line p-2">
            <option value="">Выберите поле</option>
            {editableTaskFields.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <button type="button" disabled={!item.answer.trim() || !item.field || Boolean(busy)} onClick={() => applyAnswer(item)} className="text-xs text-signal disabled:opacity-50">Перенести в карточку</button>
      </div>)}
    </div>
    <ScoreBreakdown task={task} preview />
    {editableTaskFields.map(([key, label]) => <div key={key}>
      <div className="flex justify-between gap-2 mb-1">
        <label htmlFor={`new-${key}`} className="text-sm font-medium">{label}</label>
        {key !== "title" && <button type="button" onClick={() => hint(key)} disabled={Boolean(busy) || Boolean(task[key].trim())} className="text-xs text-signal disabled:opacity-40">{busy === key ? "Думаю…" : "✨ AI Подсказка"}</button>}
      </div>
      {["title", "industry", "contact"].includes(key) ?
        <input id={`new-${key}`} maxLength={5000} value={task[key]} onChange={(e) => updateField(key, e.target.value)} className="w-full rounded border border-line p-2 text-sm" /> :
        <textarea id={`new-${key}`} rows={2} maxLength={5000} value={task[key]} onChange={(e) => updateField(key, e.target.value)} className="w-full rounded border border-line p-2 text-sm" />}
    </div>)}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={Boolean(busy)} onChange={(e) => setConfirmed(e.target.checked)} />Я проверил(а) карточку и подтверждаю достоверность заполненных сведений.</label>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    <button type="submit" disabled={Boolean(busy)} className="w-full rounded bg-ink py-2.5 text-sm text-white disabled:opacity-50">Добавить в каталог</button>
  </form>;
}
