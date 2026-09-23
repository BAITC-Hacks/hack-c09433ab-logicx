/**
 * calculateScore(task) — считает "готовность" бизнес-задачи от 0 до 100
 * на основе того, какие поля реально заполнены и насколько содержательно.
 *
 * task ожидает поля:
 *  - title            (строка, короткое название)
 *  - context          (строка, контекст/описание проблемы)
 *  - expectedResult   (строка, что должно получиться на выходе)
 *  - successCriteria  (строка, критерии успеха / метрики)
 *  - dataAvailable    (строка, какие данные/доступы есть у команды)
 *  - constraints      (строка, ограничения — сроки, стек, бюджет)
 *
 * Веса подобраны так, чтобы "жирные" содержательные поля (контекст, результат,
 * критерии) весили больше, чем формальности (название, ограничения).
 */

const FIELD_WEIGHTS = {
  title: 10,
  context: 25,
  expectedResult: 25,
  successCriteria: 20,
  dataAvailable: 12,
  constraints: 8,
};

const MIN_MEANINGFUL_LENGTH = 12; // символов, ниже которых поле считается "для галочки"

function fieldScore(value, weight) {
  if (!value) return 0;
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return 0;

  // Короткая "заглушка" (например "-", "нет", "n/a") даёт малую долю веса
  if (trimmed.length < MIN_MEANINGFUL_LENGTH) {
    return weight * 0.25;
  }

  // Полноценно заполненное поле — полный вес.
  // Небольшой бонус за развёрнутость, но не более полного веса поля.
  const richnessBonus = Math.min(trimmed.length / 200, 1); // 0..1
  return weight * (0.7 + 0.3 * richnessBonus);
}

export function calculateScore(task = {}) {
  let total = 0;
  let maxTotal = 0;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    maxTotal += weight;
    total += fieldScore(task[field], weight);
  }

  const score = Math.round((total / maxTotal) * 100);

  return {
    score,
    level: scoreToLevel(score),
    missingFields: Object.keys(FIELD_WEIGHTS).filter(
      (f) => !task[f] || String(task[f]).trim().length === 0
    ),
  };
}

export function scoreToLevel(score) {
  if (score >= 85) return { label: "Готова к запуску", badge: "🟢" };
  if (score >= 60) return { label: "Почти готова", badge: "🟡" };
  if (score >= 30) return { label: "Черновик", badge: "🟠" };
  return { label: "Только идея", badge: "🔴" };
}
