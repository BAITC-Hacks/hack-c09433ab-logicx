import { useEffect, useState } from "react";
import TaskForm from "./components/TaskForm.jsx";
import Catalog from "./components/Catalog.jsx";
import initialData from "./data/initialData.json";

const STORAGE_KEY = "hackalem_tasks";

function loadInitialTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore corrupt storage, fall back to seed data
  }
  return initialData.tasks;
}

export default function App() {
  const [tasks, setTasks] = useState(loadInitialTasks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function addTask(task) {
    setTasks((prev) => [{ ...task, id: `t${Date.now()}` }, ...prev]);
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line px-6 py-5">
        <h1 className="font-display text-3xl text-ink">HackAlem AI</h1>
        <p className="text-sm text-ink/60 mt-1">
          Геймификация практических заданий: заполняй задачу — ИИ и счётчик
          готовности помогают довести её до конца.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <TaskForm onSubmit={addTask} />
        <Catalog tasks={tasks} />
      </main>
    </div>
  );
}
