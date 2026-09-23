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
import {
  updatePublishedTask,
  validateTaskEdit,
} from "./utils/taskEditing.js";

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
    if (role !== "business") return;

    const newTask = {
      ...task,
      id: crypto.randomUUID(),
      publishedAt: new Date().toISOString(),
    };

    setState((previous) => ({
      ...previous,
      tasks: [newTask, ...previous.tasks],
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

    setState((previous) => ({
      ...previous,
      submissions: [
        ...previous.submissions,
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

    setState((previous) => ({
      ...previous,
      submissions: updateSubmissionStatus(
        previous.submissions,
        id,
        status
      ),
    }));
  }

  function editTask(id, draft, confirmed) {
    if (role !== "business") {
      throw new Error(
        "Редактирование доступно в роли бизнеса."
      );
    }

    const error = validateTaskEdit(draft, confirmed);

    if (error) {
      throw new Error(error);
    }

    if (!state.tasks.some((task) => task.id === id)) {
      throw new Error("Задача не найдена.");
    }

    setState((previous) =>
      updatePublishedTask(
        previous,
        id,
        draft,
        confirmed
      )
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* HEADER */}
      <header className="bg-slate-900 text-white px-6 py-7">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* Логотип */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-xl">
                  ✦
                </div>

                <div>
                  <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
                    HackAlem AI
                  </h1>

                  <p className="text-xs text-white/60 mt-0.5">
                    Business × AI × Students
                  </p>
                </div>
              </div>
            </div>

            {/* Роли */}
            <div
              className="flex gap-1"
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
                  className={`rounded-lg border px-5 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    role === value
                      ? "border-white bg-white text-ink"
                      : "border-white/30 bg-white/5 text-white hover:bg-white/15"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Описание */}
          <div className="mt-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AI-powered task marketplace
            </div>

            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-white">
              Превращаем бизнес-задачи
              <br />
              в реальные проекты
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              Создавайте понятные задачи, улучшайте их с помощью AI,
              оценивайте готовность и находите команды для реализации.
            </p>
          </div>

          {/* Ошибка localStorage */}
          {storageError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-500/15 border border-red-400/20 px-4 py-3 text-sm text-red-200"
            >
              {storageError}
            </p>
          )}
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Подсказка роли */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {role === "business"
                ? "Режим бизнеса"
                : "Режим команды"}
            </p>

            <h2 className="mt-1 text-2xl font-bold text-ink">
              {role === "business"
                ? "Создайте новую задачу"
                : "Найдите проект для своей команды"}
            </h2>
          </div>

        </div>

        {/* КОНТЕНТ */}
        <div
          className={
            role === "business"
              ? "grid gap-8 lg:grid-cols-[380px_1fr]"
              : ""
          }
        >
          {/* Форма бизнеса */}
          {role === "business" && (
            <div className="min-w-0">
              <TaskForm onSubmit={addTask} />
            </div>
          )}

          {/* Каталог */}
          <div className="min-w-0">
            <Catalog
              tasks={state.tasks}
              teams={state.teams}
              submissions={state.submissions}
              role={role}
              onSubmit={addSubmission}
              onDecision={decideSubmission}
              onEdit={editTask}
            />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink/50">
            HackAlem AI · Hackathon Demo
          </p>

          <p className="text-xs text-ink/40">
            AI помогает структурировать задачу — решение принимает человек.
          </p>
        </div>
      </footer>
    </div>
  );
}
