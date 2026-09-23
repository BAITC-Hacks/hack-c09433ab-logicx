import { useMemo, useState } from "react";
import {
  calculateScore,
} from "../utils/calculateScore.js";
import {
  generateClarifyingQuestions,
  generateFieldSuggestion,
} from "../services/aiService.js";
import ScoreBadge from "./ScoreBadge.jsx";

const FIELDS = [
  { key: "title", label: "Название задачи", type: "input" },
  { key: "context", label: "Контекст / в чём проблема", type: "textarea" },
  { key: "expectedResult", label: "Ожидаемый результат", type: "textarea" },
  { key: "successCriteria", label: "Критерии успеха", type: "textarea" },
  { key: "dataAvailable", label: "Доступные данные", type: "textarea" },
  { key: "constraints", label: "Ограничения", type: "textarea" },
];

const EMPTY_TASK = {
  title: "",
  context: "",
  expectedResult: "",
  successCriteria: "",
  dataAvailable: "",
  constraints: "",
};

export default function TaskForm({ onSubmit }) {
  const [task, setTask] = useState(EMPTY_TASK);
  const [rawIdea, setRawIdea] = useState("");
  const [aiQuestions, setAiQuestions] = useState([]);
  const [loadingField, setLoadingField] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const { score, level } = useMemo(() => calculateScore(task), [task]);

  function updateField(key, value) {
    setTask((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerateIdea() {
    const trimmed = rawIdea.trim();
    if (!trimmed) {
      setError("Сначала опиши задачу в 1–2 предложениях.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await generateClarifyingQuestions(trimmed);
      const questions = Array.isArray(result?.questions) ? result.questions : [];
      setAiQuestions(questions);

      const extractedTitle = result?.extractedFields?.title;
      const extractedContext = result?.extractedFields?.context;

      if (extractedTitle) updateField("title", extractedTitle);
      if (extractedContext) updateField("context", extractedContext);

      if (!questions.length) {
        setAiQuestions([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAiHint(key) {
    setError(null);
    setLoadingField(key);
    try {
      const suggestion = await generateFieldSuggestion(key, task);
      updateField(key, suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingField(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(task);
    setTask(EMPTY_TASK);
    setRawIdea("");
    setAiQuestions([]);
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-line rounded-lg p-6 space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl text-ink">Новая задача</h2>
        <p className="text-sm text-ink/60 mt-1">
          Заполняй поля — готовность считается на лету.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-signal/60 bg-signal/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-ink">🤖 Smart Builder</p>
          <span className="text-[11px] uppercase tracking-wide text-ink/50">
            AI brief
          </span>
        </div>

        <textarea
          value={rawIdea}
          onChange={(e) => setRawIdea(e.target.value)}
          rows={3}
          placeholder="Например: хотим систему, которая помогает студентам быстро составлять практические задания по Python..."
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleGenerateIdea}
            disabled={isGenerating || !rawIdea.trim()}
            className="rounded-md bg-signal px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {isGenerating ? "Генерирую…" : "Сформировать ТЗ"}
          </button>
          <span className="text-[11px] text-ink/55">
            {aiQuestions.length ? `${aiQuestions.length} уточнений` : "Нужны данные"}
          </span>
        </div>

        {aiQuestions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {aiQuestions.map((question, index) => (
              <li
                key={`${question}-${index}`}
                className="rounded-md border border-line bg-white px-2.5 py-2 text-xs text-ink/70"
              >
                {index + 1}. {question}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ScoreBadge score={score} level={level} />

      {FIELDS.map(({ key, label, type }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-ink/80">{label}</label>
            <button
              type="button"
              onClick={() => handleAiHint(key)}
              disabled={loadingField === key}
              className="text-xs font-medium text-signal hover:text-signal/70 disabled:opacity-50"
            >
              {loadingField === key ? "Думаю…" : "✨ AI Подсказка"}
            </button>
          </div>
          {type === "textarea" ? (
            <textarea
              value={task[key]}
              onChange={(e) => updateField(key, e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
            />
          ) : (
            <input
              value={task[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        className="w-full bg-ink text-paper rounded-md py-2.5 text-sm font-medium hover:bg-ink/90"
      >
        Добавить в каталог
      </button>
    </form>
  );
}
