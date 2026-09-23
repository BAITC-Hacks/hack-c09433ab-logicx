/**
 * aiService.js
 *
 * AI Builder для AI Sana.
 *
 * Сейчас используется MOCK-режим:
 * - не требует API-ключа;
 * - не отправляет данные во внешний сервис;
 * - имитирует работу AI на основе переданного контекста.
 *
 * Для реального AI API интеграция должна выполняться через server handler.
 */

// ---------------------------------------------------------
// Общие вспомогательные функции
// ---------------------------------------------------------

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function isFilled(value) {
  return normalizeText(value).length > 0;
}

function createAiError(message) {
  return new Error(`AI: ${message}`);
}

/**
 * Возвращает все заполненные поля задачи в виде одного текста.
 * Используется только для анализа уже известных пользователю данных.
 */
function buildContextText(context = {}) {
  return Object.entries(context)
    .filter(([, value]) => isFilled(value))
    .map(([key, value]) => `${key}: ${normalizeText(value)}`)
    .join("\n");
}

/**
 * Проверяет, содержит ли текст хотя бы одно слово из списка.
 */
function containsAny(text, words) {
  const normalized = normalizeText(text).toLowerCase();

  return words.some((word) =>
    normalized.includes(word.toLowerCase())
  );
}

/**
 * Возвращает первое предложение/фрагмент текста.
 * Используется для безопасного формирования названия
 * только из информации пользователя.
 */
function getFirstSentence(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(.+?[.!?])(?:\s|$)/);

  if (match) {
    return match[1].trim();
  }

  return normalized;
}

/**
 * Делает короткое название без добавления новых фактов.
 */
function makeTitle(rawDescription) {
  const firstSentence = getFirstSentence(rawDescription);

  if (!firstSentence) {
    throw createAiError(
      "недостаточно информации для формирования названия задачи."
    );
  }

  const words = firstSentence.split(/\s+/);

  if (words.length <= 8) {
    return firstSentence;
  }

  return `${words.slice(0, 8).join(" ")}…`;
}

// ---------------------------------------------------------
// PROMPT 1
// AI-анализ сырого описания
// ---------------------------------------------------------

const PROMPT_1 = `
Ты — эксперт EdTech-платформы AI Sana.

Твоя задача — проанализировать сырое описание бизнес-задачи.

Правила:
1. Не придумывай факты, которых нет в тексте.
2. Сгенерируй минимум 3 четких уточняющих вопроса.
3. Вопросы должны быть основаны на информации из описания.
4. Вопросы должны помогать уточнить разные аспекты задачи:
   - ограничения или контекст;
   - ожидаемый результат;
   - критерии успеха, данные или другие недостающие детали.
5. Не повторяй одну и ту же мысль.
6. Не спрашивай то, что уже явно указано в описании.
7. Сформируй краткое название на основе предоставленного текста.
8. context должен содержать только информацию из текста.
9. Если информации недостаточно, не выдумывай её.
10. Ответ должен соответствовать JSON-контракту:

{
  "questions": ["...", "...", "..."],
  "extractedFields": {
    "title": "...",
    "context": "..."
  }
}
`;

// ---------------------------------------------------------
// PROMPT 2
// AI-подсказка для отдельного поля
// ---------------------------------------------------------

const PROMPT_2 = `
Ты — ассистент B2B-платформы AI Sana.

Пользователь заполняет бизнес-задачу.

Тебе переданы:
1. текущее описание задачи;
2. название поля;
3. уже заполненные поля.

Твоя задача — предложить один вариант текста только на основании
имеющейся информации.

Правила:
1. Не придумывай факты.
2. Не придумывай цифры, сроки, технологии, контакты,
   пользователей, метрики или результаты.
3. Учитывай уже заполненные поля.
4. Не противоречь существующим данным.
5. Текст должен соответствовать конкретному полю.
6. Если данных недостаточно, не создавай общий или выдуманный текст.
   Верни ошибку с просьбой уточнить недостающую информацию.
7. Верни только один вариант текста.
`;

// ---------------------------------------------------------
// PROMPT 1 — generateClarifyingQuestions
// ---------------------------------------------------------

export async function generateClarifyingQuestions(rawDescription) {
  await delay(500);

  const raw = normalizeText(rawDescription);

  if (!raw) {
    throw createAiError(
      "сначала добавьте описание бизнес-задачи."
    );
  }

  if (raw.length < 15) {
    throw createAiError(
      "описание слишком короткое. Добавьте больше информации о задаче."
    );
  }

  const lowerText = raw.toLowerCase();

  const questions = [];

  // Вопрос об ожидаемом результате
  if (
    !containsAny(lowerText, [
      "результат",
      "цель",
      "получить",
      "должен",
      "нужно получить",
      "ожидаем",
    ])
  ) {
    questions.push(
      "Какой конкретный результат должен быть получен после реализации задачи?"
    );
  }

  // Вопрос о пользователях
  if (
    !containsAny(lowerText, [
      "пользователь",
      "клиент",
      "менеджер",
      "студент",
      "сотрудник",
      "аудитория",
      "для кого",
    ])
  ) {
    questions.push(
      "Кто будет пользоваться решением и для какой аудитории оно предназначено?"
    );
  }

  // Вопрос о данных
  if (
    !containsAny(lowerText, [
      "данные",
      "база",
      "crm",
      "система учета",
      "каталог",
      "информация",
      "api",
    ])
  ) {
    questions.push(
      "Какие данные или внешние системы доступны для реализации задачи?"
    );
  }

  // Вопрос об успехе
  if (
    !containsAny(lowerText, [
      "метрик",
      "критери",
      "успех",
      "kpi",
      "эффектив",
      "%",
      "сократить",
      "увеличить",
    ])
  ) {
    questions.push(
      "По каким критериям или показателям будет определяться успешность решения?"
    );
  }

  // Вопрос об ограничениях
  if (
    !containsAny(lowerText, [
      "срок",
      "огранич",
      "бюджет",
      "технолог",
      "стек",
      "интеграц",
      "безопас",
    ])
  ) {
    questions.push(
      "Какие ограничения, сроки или требования необходимо учитывать?"
    );
  }

  // Если некоторых вопросов уже не нужно задавать,
  // добираем вопросы из универсального набора.
  const fallbackQuestions = [
    "Какие основные проблемы или ограничения необходимо решить?",
    "Как должен выглядеть процесс работы пользователя с решением?",
    "Какие требования являются обязательными для первой версии?",
  ];

  for (const question of fallbackQuestions) {
    if (questions.length >= 3) {
      break;
    }

    if (!questions.includes(question)) {
      questions.push(question);
    }
  }

  const finalQuestions = questions.slice(0, 3);

  if (finalQuestions.length < 3) {
    throw createAiError(
      "не удалось сформировать достаточное количество уточняющих вопросов."
    );
  }

  const result = {
    questions: finalQuestions,
    extractedFields: {
      title: makeTitle(raw),
      context: raw,
    },
  };

  // Простая проверка структуры ответа.
  if (
    !Array.isArray(result.questions) ||
    result.questions.length < 3 ||
    typeof result.extractedFields !== "object" ||
    typeof result.extractedFields.title !== "string" ||
    typeof result.extractedFields.context !== "string"
  ) {
    throw createAiError(
      "получен некорректный формат ответа."
    );
  }

  return result;
}

// ---------------------------------------------------------
// PROMPT 2 — generateFieldSuggestion
// ---------------------------------------------------------

export async function generateFieldSuggestion(
  fieldName,
  currentContext = {}
) {
  await delay(400);

  const field = normalizeText(fieldName);

  if (!field) {
    throw createAiError(
      "не указано поле, для которого нужна подсказка."
    );
  }

  const context = currentContext || {};
  const contextText = buildContextText(context);

  if (!contextText) {
    throw createAiError(
      "недостаточно данных для формирования подсказки."
    );
  }

  const currentValue = context[field];

  // Не предлагаем AI-текст поверх уже заполненного поля.
  if (isFilled(currentValue)) {
    throw createAiError(
      `поле "${field}" уже заполнено.`
    );
  }

  const sourceTexts = [
    context.context,
    context.need,
    context.expectedResult,
    context.successCriteria,
    context.constraints,
    context.users,
    context.dataAvailable,
    context.contact,
    context.interactionFormat,
    context.industry,
  ]
    .filter(isFilled)
    .map(normalizeText);

  const sourceText = sourceTexts.join(" ");

  // -------------------------------------------------------
  // Пользователи
  // -------------------------------------------------------

  if (field === "users") {
    const existing = [
      context.context,
      context.need,
      context.expectedResult,
    ]
      .filter(isFilled)
      .map(normalizeText)
      .find((text) =>
        containsAny(text, [
          "пользователь",
          "клиент",
          "менеджер",
          "студент",
          "сотрудник",
          "аудитория",
        ])
      );

    if (!existing) {
      throw createAiError(
        "не удалось определить пользователей из текущего описания. Уточните целевую аудиторию."
      );
    }

    return existing;
  }

  // -------------------------------------------------------
  // Отрасль
  // -------------------------------------------------------

  if (field === "industry") {
    if (
      containsAny(sourceText, [
        "edtech",
        "образован",
        "обучен",
        "вуз",
        "университет",
        "школ",
      ])
    ) {
      return "Образование";
    }

    if (
      containsAny(sourceText, [
        "продаж",
        "клиент",
        "crm",
        "менеджер",
        "товар",
        "заказ",
      ])
    ) {
      return "Продажи";
    }

    throw createAiError(
      "отрасль не указана в текущем контексте. Уточните отрасль задачи."
    );
  }

  // -------------------------------------------------------
  // Потребность
  // -------------------------------------------------------

  if (field === "need") {
    if (isFilled(context.context)) {
      return normalizeText(context.context);
    }

    throw createAiError(
      "недостаточно информации о проблеме бизнеса для формирования потребности."
    );
  }

  // -------------------------------------------------------
  // Доступные данные
  // -------------------------------------------------------

  if (field === "dataAvailable") {
    const dataSource = [
      context.context,
      context.need,
      context.expectedResult,
    ]
      .filter(isFilled)
      .map(normalizeText)
      .find((text) =>
        containsAny(text, [
          "данные",
          "база",
          "crm",
          "api",
          "каталог",
          "система учета",
          "информация",
        ])
      );

    if (!dataSource) {
      throw createAiError(
        "в описании не указаны доступные данные или источники данных."
      );
    }

    return dataSource;
  }

  // -------------------------------------------------------
  // Контакт
  // -------------------------------------------------------

  if (field === "contact") {
    if (isFilled(context.contact)) {
      return normalizeText(context.contact);
    }

    const contactMatch = sourceText.match(
      /(?:telegram|телеграм|email|e-mail|почта|телефон|phone|@[\w.-]+)/i
    );

    if (contactMatch) {
      return contactMatch[0];
    }

    throw createAiError(
      "контакт не указан. Добавьте Telegram, email или другой контакт."
    );
  }

  // -------------------------------------------------------
  // Формат взаимодействия
  // -------------------------------------------------------

  if (field === "interactionFormat") {
    const formats = [
      "WhatsApp Business API",
      "WhatsApp",
      "Telegram",
      "Email",
      "веб-сервис",
      "веб-приложение",
      "CRM",
      "API",
    ];

    const foundFormat = formats.find((format) =>
      sourceText.toLowerCase().includes(format.toLowerCase())
    );

    if (foundFormat) {
      return foundFormat;
    }

    throw createAiError(
      "формат взаимодействия не указан. Уточните, где пользователь будет работать с решением."
    );
  }

  // -------------------------------------------------------
  // Ожидаемый результат
  // -------------------------------------------------------

  if (field === "expectedResult") {
    if (isFilled(context.expectedResult)) {
      return normalizeText(context.expectedResult);
    }

    const resultText = [
      context.context,
      context.need,
    ]
      .filter(isFilled)
      .map(normalizeText)
      .find((text) =>
        containsAny(text, [
          "результат",
          "получить",
          "система",
          "решение",
          "ассистент",
          "сервис",
        ])
      );

    if (resultText) {
      return resultText;
    }

    throw createAiError(
      "ожидаемый результат не описан. Уточните, что должно быть получено после реализации."
    );
  }

  // -------------------------------------------------------
  // Критерии успеха
  // -------------------------------------------------------

  if (field === "successCriteria") {
    const criteriaText = sourceText.match(
      /(?:\d+\s*%|\d+\s*(?:мин|минут|час|день|дней)|KPI|kpi|метрик|критери|успех)/i
    );

    if (criteriaText) {
      return criteriaText[0];
    }

    throw createAiError(
      "критерии успеха не указаны. Добавьте измеримый результат или критерий проверки."
    );
  }

  // -------------------------------------------------------
  // Ограничения
  // -------------------------------------------------------

  if (field === "constraints") {
    const constraintMatch = sourceText.match(
      /(?:срок[^.]*|огранич[^.]*|бюджет[^.]*|технолог[^.]*|стек[^.]*|API[^.]*)/i
    );

    if (constraintMatch) {
      return constraintMatch[0].trim();
    }

    throw createAiError(
      "ограничения не указаны. Добавьте сроки, технологии, бюджет или другие ограничения."
    );
  }

  // -------------------------------------------------------
  // Контекст
  // -------------------------------------------------------

  if (field === "context") {
    if (isFilled(context.context)) {
      return normalizeText(context.context);
    }

    throw createAiError(
      "контекст задачи отсутствует."
    );
  }

  // -------------------------------------------------------
  // Название
  // -------------------------------------------------------

  if (field === "title") {
    const titleSource =
      context.context ||
      context.need ||
      context.expectedResult;

    if (!isFilled(titleSource)) {
      throw createAiError(
        "недостаточно информации для формирования названия."
      );
    }

    return makeTitle(titleSource);
  }

  // -------------------------------------------------------
  // Неизвестное поле
  // -------------------------------------------------------

  throw createAiError(
    `поле "${field}" не поддерживается AI-подсказками.`
  );
}

// Экспортируем режим для удобной проверки в UI/тестах.
export const AI_MODE = "mock";
