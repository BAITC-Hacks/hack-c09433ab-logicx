/**
 * calculateScore(task) — считает готовность бизнес-задачи от 0 до 100.
 *
 * Веса:
 * context + need             = 20
 * dataAvailable              = 20
 * expectedResult             = 15
 * successCriteria            = 15
 * constraints                = 10
 * users                      = 10
 * contact + interactionFormat = 10
 *
 * title не приносит баллов.
 */

const FIELD_WEIGHTS = {
  context: 10,
  need: 10,
  dataAvailable: 20,
  expectedResult: 15,
  successCriteria: 15,
  constraints: 10,
  users: 10,
  contact: 5,
  interactionFormat: 5,
};

const FIELD_LABELS = {
  context: "Контекст",
  need: "Потребность",
  dataAvailable: "Доступные данные",
  expectedResult: "Ожидаемый результат",
  successCriteria: "Критерии успеха",
  constraints: "Ограничения",
  users: "Пользователи",
  contact: "Контакт",
  interactionFormat: "Формат взаимодействия",
};

function isFilled(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function fieldScore(value, weight) {
  if (!isFilled(value)) {
    return 0;
  }

  const text = String(value).trim();

  // Очень короткий ответ считается частично заполненным.
  if (text.length < 12) {
    return Math.round(weight * 0.5);
  }

  // Нормально заполненное поле получает полный вес.
  return weight;
}

export function scoreToLevel(score) {
  if (score >= 90) {
    return {
      label: "Приоритетная",
      badge: "🔵",
    };
  }

  if (score >= 70) {
    return {
      label: "Готовая",
      badge: "🟢",
    };
  }

  if (score >= 40) {
    return {
      label: "Рабочая",
      badge: "🟡",
    };
  }

  return {
    label: "Черновик",
    badge: "🟠",
  };
}

export function calculateScore(task = {}) {
  const breakdown = {};
  const missingFields = [];

  let score = 0;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const points = fieldScore(task[field], weight);

    score += points;

    breakdown[field] = {
      label: FIELD_LABELS[field],
      points,
      maxPoints: weight,
      filled: isFilled(task[field]),
    };

    if (!isFilled(task[field])) {
      missingFields.push(FIELD_LABELS[field]);
    }
  }

  return {
    score,
    level: scoreToLevel(score),
    missingFields,
    breakdown,
  };
}
