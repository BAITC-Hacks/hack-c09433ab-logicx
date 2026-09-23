import { useState } from "react";
import { safeLink, submissionStatuses, validateSubmission } from "../utils/submissions.js";
import TaskEditor from "./TaskEditor.jsx";
import ScoreBreakdown from "./ScoreBreakdown.jsx";

const details = [
  ["context", "Контекст"], ["need", "Потребность"], ["users", "Пользователи"],
  ["dataAvailable", "Данные"], ["constraints", "Ограничения"],
  ["expectedResult", "Ожидаемый результат"], ["successCriteria", "Критерии успеха"],
  ["contact", "Контакт"], ["interactionFormat", "Формат взаимодействия"],
];
const empty = { teamId: "", idea: "", plan: "", deadline: "", link: "" };

export default function TaskDetails({ task, teams, submissions, role, onSubmit, onDecision, onEdit, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function submit(event) {
    event.preventDefault();
    const validation = validateSubmission(draft, teams);
    if (validation) { setError(validation); return; }
    onSubmit({ ...Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])), taskId: task.id });
    setDraft(empty);
    setError("");
    setMessage("Отклик отправлен. Решение принимает бизнес.");
  }

  return (
    <section className="bg-white" aria-label={`Карточка: ${task.title}`}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-5">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">{isEditing ? "Редактирование" : "Карточка задачи"}</p>
          <h3 className="break-words text-xl font-semibold">{task.title || "Без названия"}</h3>
        </div>
        <button autoFocus type="button" onClick={onClose} className="shrink-0 rounded-md border border-line px-3 py-2 text-sm hover:bg-paper">Закрыть</button>
      </div>
      <div className="space-y-5 p-6">
      {!isEditing && <ScoreBreakdown task={task} />}
      {role === "business" && !isEditing && <button type="button" onClick={() => { setIsEditing(true); setMessage(""); }} className="rounded border border-line px-3 py-2 text-sm">Редактировать задачу</button>}
      {isEditing && role === "business" ? <TaskEditor task={task} onCancel={() => setIsEditing(false)} onSave={(fields, confirmed) => {
        onEdit(task.id, fields, confirmed);
        setIsEditing(false);
        setMessage("Изменения сохранены. Рейтинг и позиция в каталоге пересчитаны.");
      }} /> : <dl className="space-y-3 text-sm">
        {details.map(([key, label]) => <div key={key}>
          <dt className="font-semibold">{label}</dt>
          <dd className="whitespace-pre-wrap break-words text-ink/70">{task[key] || "Нужно уточнить"}</dd>
        </div>)}
      </dl>}
      {role === "student" && <form onSubmit={submit} className="border-t border-line pt-4 space-y-3">
        <h4 className="font-semibold">Предложить решение</h4>
        <p className="text-xs text-ink/60">Можно откликнуться при любом рейтинге задачи.</p>
        <label className="block text-sm">Команда
          <select required value={draft.teamId} onChange={(e) => setDraft({ ...draft, teamId: e.target.value })} className="mt-1 w-full border border-line rounded p-2">
            <option value="">Выберите команду</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </label>
        {[["idea", "Идея решения"], ["plan", "План работы"], ["deadline", "Срок"], ["link", "Ссылка на прототип"]].map(([key, label]) => (
          <label key={key} className="block text-sm">{label}
            {key === "idea" || key === "plan" ?
              <textarea required rows={3} maxLength={5000} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="mt-1 w-full border border-line rounded p-2" /> :
              <input required type={key === "link" ? "url" : "text"} maxLength={2000} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="mt-1 w-full border border-line rounded p-2" />}
          </label>
        ))}
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button className="rounded bg-ink text-white px-4 py-2">Отправить отклик</button>
      </form>}
      {message && <p role="status" className="text-sm text-signal">{message}</p>}
      <div className="border-t border-line pt-4 space-y-3">
        <h4 className="font-semibold">Отклики ({submissions.length})</h4>
        {role === "business" && <p className="text-xs text-ink/60">Можно выбрать несколько команд или не выбирать ни одной.</p>}
        {!submissions.length && <p className="text-sm text-ink/60">Пока нет предложений.</p>}
        {submissions.map((item) => <article key={item.id} className="border border-line rounded p-3 space-y-2 text-sm">
          <h5 className="font-semibold">{teams.find((team) => team.id === item.teamId)?.name || "Команда"}</h5>
          <p className="font-medium" role="status">{submissionStatuses[item.status] || submissionStatuses.pending}</p>
          <p className="whitespace-pre-wrap break-words"><strong>Идея: </strong>{item.idea}</p>
          <p className="whitespace-pre-wrap break-words"><strong>План: </strong>{item.plan}</p>
          <p><strong>Срок: </strong>{item.deadline || "Уточняется в плане"}</p>
          {safeLink(item.link) && <a className="text-signal underline" href={safeLink(item.link)} target="_blank" rel="noopener noreferrer">Открыть прототип</a>}
          {role === "business" && <div className="flex flex-wrap gap-2 pt-2">
            {[["accepted", "Выбрать"], ["rejected", "Отклонить"], ["pending", "Вернуть на рассмотрение"]].map(([status, label]) => (
              <button key={status} type="button" disabled={item.status === status} onClick={() => onDecision(item.id, status)} className="border border-line rounded px-2 py-1 disabled:opacity-40">{label}</button>
            ))}
          </div>}
        </article>)}
      </div>
      </div>
    </section>
  );
}
