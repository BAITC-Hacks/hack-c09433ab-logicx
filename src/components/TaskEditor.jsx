import { useState } from "react";
import { editableTaskFields, taskToDraft, validateTaskEdit } from "../utils/taskEditing.js";
import ScoreBreakdown from "./ScoreBreakdown.jsx";

export default function TaskEditor({ task, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => taskToDraft(task));
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  function change(key, value) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setConfirmed(false);
    setError("");
  }

  function save(event) {
    event.preventDefault();
    const validation = validateTaskEdit(draft, confirmed);
    if (validation) { setError(validation); return; }
    try {
      onSave(draft, confirmed);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4" aria-label="Редактирование задачи">
      <h4 className="font-semibold">Редактирование опубликованной задачи</h4>
      <p className="text-sm text-ink/60">Изменения появятся в каталоге после подтверждения. Существующие отклики сохранятся.</p>
      <div aria-live="polite">
        <ScoreBreakdown task={{ ...task, ...draft }} preview />
      </div>
      {editableTaskFields.map(([key, label]) => (
        <label key={key} className="block text-sm font-medium">{label}{["title", "context"].includes(key) ? " *" : ""}
          {["title", "industry", "contact"].includes(key) ?
            <input required={key === "title"} maxLength={5000} value={draft[key]} onChange={(e) => change(key, e.target.value)} className="mt-1 w-full rounded border border-line p-2 font-normal" /> :
            <textarea required={key === "context"} maxLength={5000} rows={3} value={draft[key]} onChange={(e) => change(key, e.target.value)} className="mt-1 w-full rounded border border-line p-2 font-normal" />}
        </label>
      ))}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
        Подтверждаю достоверность заполненных сведений и публикацию изменений.
      </label>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded bg-ink px-3 py-2 text-sm text-white">Подтвердить и сохранить</button>
        <button type="button" onClick={onCancel} className="rounded border border-line px-3 py-2 text-sm">Отменить изменения</button>
      </div>
    </form>
  );
}
