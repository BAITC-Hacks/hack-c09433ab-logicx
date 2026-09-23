import { calculateScore } from "../utils/calculateScore.js";
import ScoreBadge from "./ScoreBadge.jsx";

export default function Catalog({ tasks }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-ink">Каталог задач</h2>
      {tasks.length === 0 && (
        <p className="text-sm text-ink/50">Пока нет задач — добавь первую слева.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {tasks.map((task) => {
          const { score, level } = calculateScore(task);
          return (
            <div
              key={task.id}
              className="bg-white border border-line rounded-lg p-4 space-y-3"
            >
              <h3 className="font-medium text-ink">
                {task.title || "Без названия"}
              </h3>
              {task.context && (
                <p className="text-sm text-ink/60 line-clamp-2">{task.context}</p>
              )}
              <ScoreBadge score={score} level={level} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
