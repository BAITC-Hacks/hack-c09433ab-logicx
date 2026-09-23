import { useState } from "react";
import {
  safeLink,
  submissionStatuses,
  validateSubmission,
} from "../utils/submissions.js";
import { calculateScore } from "../utils/calculateScore.js";
import ScoreBadge from "./ScoreBadge.jsx";

const details = [
  ["context", "Контекст"],
  ["need", "Потребность"],
  ["users", "Пользователи"],
  ["dataAvailable", "Данные"],
  ["constraints", "Ограничения"],
  ["expectedResult", "Ожидаемый результат"],
  ["successCriteria", "Критерии успеха"],
  ["contact", "Контакт"],
  ["interactionFormat", "Формат взаимодействия"],
];

const empty = {
  teamId: "",
  idea: "",
  plan: "",
  deadline: "",
  link: "",
};

export default function TaskDetails({
  task,
  teams,
  submissions,
  role,
  onSubmit,
  onDecision,
  onClose,
}) {
  const [draft, setDraft] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { score, level, breakdown, missingFields } =
    calculateScore(task);

  function submit(event) {
    event.preventDefault();

    const validation = validateSubmission(draft, teams);

    if (validation) {
      setError(validation);
      return;
    }

    onSubmit({
      ...Object.fromEntries(
        Object.entries(draft).map(([key, value]) => [
          key,
          value.trim(),
        ])
      ),
      taskId: task.id,
    });

    setDraft(empty);
    setError("");
    setMessage(
      "Отклик отправлен. Решение принимает бизнес."
    );
  }

  return (
    <section
      className="rounded-lg border border-line bg-white p-5 space-y-5"
      aria-label={`Карточка: ${task.title}`}
    >
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-ink">
            {task.title || "Без названия"}
          </h3>

          <p className="text-sm text-ink/60 mt-1">
            {task.industry || "Без темы"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-signal"
        >
          Закрыть
        </button>
      </div>

      {/* Рейтинг */}
      <div>
        <ScoreBadge score={score} level={level} />

        <div className="mt-3 rounded-lg border border-line bg-paper/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-ink">
              Разбор рейтинга
            </h4>

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
        </div>
      </div>

      {/* Поля задачи */}
      <dl className="space-y-3 text-sm">
        {details.map(([key, label]) => (
          <div key={key}>
            <dt className="font-semibold">
              {label}
            </dt>

            <dd className="whitespace-pre-wrap break-words text-ink/70">
              {task[key] || "Нужно уточнить"}
            </dd>
          </div>
        ))}
      </dl>

      {/* Форма отклика */}
      {role === "student" && (
        <form
          onSubmit={submit}
          className="border-t border-line pt-4 space-y-3"
        >
          <h4 className="font-semibold">
            Предложить решение
          </h4>

          <p className="text-xs text-ink/60">
            Можно откликнуться при любом рейтинге задачи.
          </p>

          <label className="block text-sm">
            Команда

            <
