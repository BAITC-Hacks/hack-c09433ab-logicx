export default function ScoreBadge({ score, level }) {
  const barColor =
    score >= 85
      ? "bg-signal"
      : score >= 60
      ? "bg-amber-500"
      : score >= 30
      ? "bg-embers"
      : "bg-rose-500";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink/70">
          {level.badge} {level.label}
        </span>
        <span className="text-sm font-semibold text-ink">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-line overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
