import { useState } from "react";
import { calculateScore } from "../utils/calculateScore.js";
import ScoreBadge from "./ScoreBadge.jsx";
import TaskDetails from "./TaskDetails.jsx";
import TaskPanel from "./TaskPanel.jsx";

export default function Catalog({ tasks, teams, submissions, role, onSubmit, onDecision, onEdit }) {
  const [selectedId, setSelectedId] = useState(null);
  const [industry, setIndustry] = useState("");
  const [level, setLevel] = useState("");
  const rated = tasks.map((task) => ({ task, ...calculateScore(task) })).sort((a, b) => b.score - a.score);
  const industries = [...new Set(tasks.map((task) => task.industry).filter(Boolean))];
  const levels = [...new Set(rated.map((item) => item.level.label))];
  const visible = rated.filter((item) => (!industry || item.task.industry === industry) && (!level || item.level.label === level));
  const selected = tasks.find((task) => task.id === selectedId);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-ink">Каталог задач</h2>
      <p className="text-sm text-ink/60">По убыванию рейтинга. Отклики доступны при любом уровне готовности.</p>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Тема
          <select className="block border border-line rounded p-2" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">Все темы</option>
            {industries.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm">Готовность
          <select className="block border border-line rounded p-2" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Все уровни</option>
            {levels.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {!visible.length && <p className="text-sm text-ink/60">Задач по выбранным условиям нет.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map(({ task, score, level: taskLevel }) => (
          <article key={task.id} className="bg-white border border-line rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-ink">{task.title || "Без названия"}</h3>
            <p className="text-xs text-ink/60">{task.industry || "Без темы"}</p>
            <p className="text-sm text-ink/60 line-clamp-2">{task.context}</p>
            <ScoreBadge score={score} level={taskLevel} />
            <button type="button" aria-haspopup="dialog" aria-expanded={selectedId === task.id} onClick={() => setSelectedId(task.id)} className="w-full rounded-md border border-line px-3 py-2 text-left text-sm font-medium text-signal hover:bg-signal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal">
              Открыть задачу · {submissions.filter((item) => item.taskId === task.id).length} откликов
            </button>
          </article>
        ))}
      </div>
      {selected && <TaskPanel key={selected.id} title={selected.title} onClose={() => setSelectedId(null)}>
        <TaskDetails key={`${selected.id}-${role}`} task={selected} teams={teams} submissions={submissions.filter((item) => item.taskId === selected.id)} role={role} onSubmit={onSubmit} onDecision={onDecision} onEdit={onEdit} onClose={() => setSelectedId(null)} />
      </TaskPanel>}
    </div>
  );
}
