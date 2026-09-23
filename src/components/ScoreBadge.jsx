export default function ScoreBadge({ score, level }) {
  const barColor =
    score >= 90
      ? "bg-signal"
      : score >= 70
      ? "bg-green-500"
      : score >= 40
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="w-full rounded-lg border border-line bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-ink">
            {level.badge} {level.label}
          </span>

          <p className="text-xs text-ink/50 mt-0.5">
            Предварительная готовность задачи
          </p>
        </div>

        <span className="text-lg font-bold text-ink">
          {score}/100
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-line overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-out`}
          style={{
            width: `${Math.min(Math.max(score, 0), 100)}%`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-ink/45">
        <span>Черновик 0–39</span>
        <span>Рабочая 40–69</span>
        <span>Готовая 70–89</span>
        <span>Приоритетная 90–100</span>
      </div>
    </div>
  );
}
