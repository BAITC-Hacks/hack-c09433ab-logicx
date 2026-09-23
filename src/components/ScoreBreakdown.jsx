import { calculateScore } from "../utils/calculateScore.js";
import ScoreBadge from "./ScoreBadge.jsx";

export default function ScoreBreakdown({ task, preview = false }) {
  const { score, level, breakdown, missingFields } = calculateScore(task);
  return <div className="space-y-3">
    <p className="text-xs text-ink/60">{preview ? "Предварительный рейтинг — подтвердите сведения перед публикацией." : "Готовность опубликованной задачи"}</p>
    <ScoreBadge score={score} level={level} />
    <details className="rounded border border-line p-3 text-sm">
      <summary className="cursor-pointer font-medium">Из чего складывается рейтинг</summary>
      <dl className="mt-3 space-y-2">
        {Object.entries(breakdown).map(([key, item]) => <div key={key} className="flex justify-between gap-3"><dt>{item.label}</dt><dd>{item.points}/{item.maxPoints}</dd></div>)}
      </dl>
      <p className="mt-3 text-xs text-ink/60">Пустые поля и заглушки не дают баллов. Короткое описание получает часть веса. Оценка отражает полноту, а не автоматическую проверку достоверности.</p>
    </details>
    {missingFields.length > 0 && <p className="text-xs text-amber-800">Нужно уточнить: {missingFields.join(", ")}.</p>}
  </div>;
}
