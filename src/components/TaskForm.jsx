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
  { key: "industry", label: "Отрасль", type: "input" },
  { key: "context", label: "Контекст / в чём проблема", type: "textarea" },
  { key: "need", label: "Потребность бизнеса", type: "textarea" },
  { key: "users", label: "Пользователи / целевая аудитория", type: "textarea" },
  { key: "dataAvailable", label: "Доступные данные", type: "textarea" },
  { key: "expectedResult", label: "Ожидаемый результат", type: "textarea" },
  { key: "successCriteria", label: "Критерии успеха", type: "textarea" },
  { key: "constraints", label: "Ограничения", type: "textarea" },
  { key: "contact", label: "Контакт", type: "input" },
  {
    key: "interactionFormat",
    label: "Формат взаимодействия",
    type: "input",
  },
];

const EMPTY_TASK = {
  title: "",
  industry: "",
  context: "",
  need: "",
  users: "",
  dataAvailable: "",
  expectedResult: "",
  successCriteria: "",
  constraints: "",
  contact: "",
  interactionFormat: "",
};

export default function TaskForm({ onSubmit }) {
  const [task, setTask] = useState(EMPTY_TASK);
  const [rawIdea, setRawIdea] = useState("");
  const [aiQuestions, setAiQuestions] = useState([]);
  const [loadingField, setLoadingField] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { score, level, breakdown, missingFields } = useMemo(
    () => calculateScore(task),
    [task]
  );

  function updateField(key, value) {
    setTask((prev) => ({
      ...prev,
      [key]: value,
    }));

    // После ручного изменения карточку нужно подтвердить заново.
    setIsConfirmed(false);
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

      const questions = Array.isArray(result?.questions)
        ? result.questions
        : [];

      setAiQuestions(questions);

      const extractedFields = result?.extractedFields || {};

      // AI не перезаписывает поля, которые пользователь уже заполнил.
      setTask((prev) => {
        const next = { ...prev };

        Object.keys(extractedFields).forEach((key) => {
          const aiValue = extractedFields[key];

          if (
            Object.prototype.hasOwnProperty.call(next, key) &&
            !String(next[key] || "").trim() &&
            aiValue
          ) {
            next[key] = aiValue;
          }
        });

        return next;
      });

      if (!questions.length) {
        setAiQuestions([]);
      }
    } catch (err) {
      setError(err.message || "Не удалось получить ответ от AI.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAiHint(key) {
    setError(null);
    setLoadingField(key);

    try {
      const suggestion = await generateFieldSuggestion(key, task);

      // AI-подсказка не должна автоматически затирать
      // ручной текст пользователя.
      setTask((prev) => {
        if (String(prev[key] || "").trim()) {
          return prev;
        }

        return {
          ...prev,
          [key]: suggestion,
        };
      });

      setIsConfirmed(false);
    } catch (err) {
      setError(err.message || "Не удалось получить AI-подсказку.");
    } finally {
      setLoadingField(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!task.title.trim()) {
      setError("Введите название задачи.");
      return;
    }

    if (!task.context.trim()) {
      setError("Введите описание или контекст задачи.");
      return;
    }

    // Низкий рейтинг НЕ блокирует публикацию.
    if (!isConfirmed) {
      setError("Сначала подтвердите карточку перед публикацией.");
      return;
    }

    onSubmit({
      ...task,
      score,
      level,
      missingFields,
      breakdown,
      confirmed: true,
    });

    setTask({ ...EMPTY_TASK });
    setRawIdea("");
    setAiQuestions([]);
    setError(null);
    setIsConfirmed(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-line rounded-lg p-6 space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl text-ink">
          Новая задача
        </h2>

        <p className="text-sm text-ink/60 mt-1">
          Заполняй поля — готовность считается на лету.
        </p>
      </div>

      {/* AI Smart Builder */}
      <div className="rounded-xl border border-dashed border-signal/60 bg-signal/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-ink">
            🤖 Smart Builder
          </p>

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
            {aiQuestions.length
              ? `${aiQuestions.length} уточнений`
              : "Нужны данные"}
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

      {/* Рейтинг */}
      <ScoreBadge score={score} level={level} />

      {/* Предварительный рейтинг */}
      <div className="rounded-lg border border-line bg-paper/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">
            Предварительный рейтинг
          </h3>

          <span className="text-lg font-bold text-ink">
            {score}/100
          </span>
        </div>

        <div className="space-y-2">
          {Object.entries(breakdown).map(([key, item]) => (
            <div
              key={key}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-ink/70">
                {item.label}
              </span>

              <span className="font-medium text-ink">
                {item.points}/{item.maxPoints}
              </span>
            </div>
          ))}
        </div>

        {missingFields.length > 0 && (
          <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-800">
              Не хватает информации:
            </p>

            <ul className="mt-1 list-disc list-inside text-xs text-amber-700">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {missingFields.length === 0 && (
          <p className="mt-4 text-xs text-green-700">
            Все основные поля заполнены.
          </p>
        )}
      </div>

      {/* Поля карточки */}
      {FIELDS.map(({ key, label, type }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-ink/80">
              {label}
            </label>

            {key !== "title" && (
              <button
                type="button"
                onClick={() => handleAiHint(key)}
                disabled={loadingField === key}
                className="text-xs font-medium text-signal hover:text-signal/70 disabled:opacity-50"
              >
                {loadingField === key
                  ? "Думаю…"
                  : "✨ AI Подсказка"}
              </button>
            )}
          </div>

          {type === "textarea" ? (
            <textarea
              value={task[key]}
              onChange={(e) =>
                updateField(key, e.target.value)
              }
              rows={2}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
            />
          ) : (
            <input
              value={task[key]}
              onChange={(e) =>
                updateField(key, e.target.value)
              }
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/40"
            />
          )}
        </div>
      ))}

      {/* Подтверждение человеком */}
      <div className="rounded-lg border border-line bg-white p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => {
              setIsConfirmed(e.target.checked);
              setError(null);
            }}
            className="mt-1"
          />

          <span className="text-sm text-ink/80">
            Я проверил(а) карточку задачи и подтверждаю,
            что информация корректна и готова к публикации.
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-rose-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-ink text-paper rounded-md py-2.5 text-sm font-medium hover:bg-ink/90"
      >
        Добавить в каталог
      </button>
    </form>
  );
}
