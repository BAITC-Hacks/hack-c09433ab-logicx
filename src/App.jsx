import { useEffect, useState } from "react";
import TaskForm from "./components/TaskForm.jsx";
import Catalog from "./components/Catalog.jsx";
import initialData from "./data/initialData.json";
import demoData from "../data/initialData.json";
import { loadDemoState, STATE_KEY } from "./utils/demoState.js";
import {
  updateSubmissionStatus,
  validateSubmission,
} from "./utils/submissions.js";

export default function App() {
  const [state, setState] = useState(() =>
    loadDemoState(
      { getItem: (key) => localStorage.getItem(key) },
      demoData,
      initialData
    )
  );

  const [role, setRole] = useState("business");
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      setStorageError("");
    } catch {
      setStorageError(
        "Не удалось сохранить изменения в браузере. Не закрывайте страницу до завершения демонстрации."
      );
    }
  }, [state]);

  function addTask(task) {
    const newTask = {
      ...task,

      // Данные карточки сохраняются полностью,
      // включая новые поля и рейтинг.
      id: crypto.randomUUID(),

      confirmed: true,

      publishedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  }

  function addSubmission(submission) {
    if (
      role !== "student" ||
      validateSubmission(submission, state.teams) ||
      !state.tasks.some((task) => task.id === submission.taskId)
    ) {
      return;
    }

    setState((prev) => ({
      ...prev,
      submissions: [
        ...prev.submissions,
        {
          ...submission,
          id: crypto.randomUUID(),
          status: "pending",
        },
      ],
    }));
  }

  function decideSubmission(id, status) {
    if (role !== "business") return;

    setState((prev) => ({
      ...prev,
      submissions: updateSubmissionStatus(
        prev.submissions,
        id,
        status
      ),
    }));
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line px-6 py-5">
        <h1 className="font-display text-3xl text-ink">
          HackAlem AI
        </h1>

        <p className="text-sm text-ink/60 mt-1">
          Геймификация практических заданий: заполняй задачу — ИИ и
          счётчик готовности помогают довести её до конца.
        </p>

        <div
          className="flex gap-2 mt-4"
          aria-label="Демонстрационная роль"
        >
          {[
            ["business", "Бизнес"],
            ["student", "Команда"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={role === value}
              onClick={() => setRole(value)}
              className={`rounded px-4 py-2 text-sm ${
                role === value
                  ? "bg-ink text-white"
                  : "border border-line"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-ink/60 mt-2">
          Демо на одном устройстве: переключайте роль, чтобы пройти
          сценарий бизнеса и команды.
        </p>

        {storageError && (
          <p
            role="alert"
            className="text-sm text-rose-600 mt-2"
          >
            {storageError}
          </p>
        )}
      </header>

      <main
        className={`max-w-5xl mx-auto px-6 py-8 grid gap-8 ${
          role === "business"
            ? "lg:grid-cols-[380px_1fr]"
            : ""
        }`}
      >
        <div
          className={
            role === "business" ? "" : "hidden"
          }
        >
          <TaskForm onSubmit={addTask} />
        </div>

        <Catalog
          tasks={state.tasks}
          teams={state.teams}
          submissions={state.submissions}
          role={role}
          onSubmit={addSubmission}
          onDecision={decideSubmission}
        />
      </main>
    </div>
  );
}
