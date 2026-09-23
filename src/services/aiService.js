// /**
//  * aiService.js — тонкий слой поверх OpenAI Chat Completions API.
//  *
//  * ВАЖНО: ключ никогда не хардкодится. Он читается из переменной окружения
//  * Vite (см. .env.example) и подставляется в заголовок Authorization.
//  * Для хакатона это ок; для продакшена такие вызовы нужно проксировать
//  * через свой backend, чтобы ключ не утекал в браузер.
//  */

// const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// const MODEL = "gpt-4o-mini";

// function getApiKey() {
//   const key = import.meta.env.VITE_OPENAI_API_KEY;
//   if (!key) {
//     throw new Error(
//       "VITE_OPENAI_API_KEY не задан. Добавь его в файл .env (см. .env.example)."
//     );
//   }
//   return key;
// }

// async function callOpenAI(systemPrompt, userPrompt) {
//   const response = await fetch(OPENAI_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${getApiKey()}`,
//     },
//     body: JSON.stringify({
//       model: MODEL,
//       temperature: 0.4,
//       response_format: { type: "json_object" },
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: userPrompt },
//       ],
//     }),
//   });

//   if (!response.ok) {
//     const errText = await response.text();
//     throw new Error(`OpenAI API error ${response.status}: ${errText}`);
//   }

//   const data = await response.json();
//   const raw = data.choices?.[0]?.message?.content ?? "{}";

//   try {
//     return JSON.parse(raw);
//   } catch {
//     throw new Error("ИИ вернул не-JSON ответ: " + raw);
//   }
// }

// /**
//  * Промпт №1: анализирует сырое описание задачи, возвращает 3 уточняющих
//  * вопроса и извлечённые поля (title, context).
//  */
// export async function generateClarifyingQuestions(rawDescription) {
//   const systemPrompt =
//     "Ты — эксперт EdTech-платформы. Твоя задача — проанализировать сырое " +
//     "описание бизнес-задачи и вернуть строго JSON без разметки markdown и " +
//     "без вводных слов.\n\n" +
//     "Формат ответа JSON:\n" +
//     `{
//   "questions": [
//     "Уточняющий вопрос 1 по контексту или ограничению?",
//     "Уточняющий вопрос 2 по ожидаемому результату?",
//     "Уточняющий вопрос 3 по критериям успеха или данным?"
//   ],
//   "extractedFields": {
//     "title": "Сгенерированное краткое название задачи",
//     "context": "Извлеченный контекст из текста пользователя (если есть)"
//   }
// }`;

//   return callOpenAI(systemPrompt, rawDescription);
// }

// /**
//  * Промпт №2: автоподсказка для пустого поля формы ("✨ AI Подсказка").
//  * fieldName — имя поля (например "expectedResult"), currentContext —
//  * то, что пользователь уже успел заполнить в остальной форме.
//  */
// export async function generateFieldSuggestion(fieldName, currentContext) {
//   const systemPrompt =
//     "Ты — ассистент B2B-платформы. Пользователь заполняет бизнес-задачу. " +
//     "Тебе дано текущее описание задачи и имя пустого поля, которое нужно " +
//     "заполнить.\n\n" +
//     "Сгенерируй ровно 1 профессиональный, реалистичный вариант заполнения " +
//     "для этого поля на основе контекста. Не придумывай лишние факты.\n\n" +
//     "Формат ответа JSON:\n" +
//     `{
//   "suggestedText": "Текст подсказки для поля..."
// }`;

//   const userPrompt = JSON.stringify({
//     field: fieldName,
//     context: currentContext,
//   });

//   const result = await callOpenAI(systemPrompt, userPrompt);
//   return result.suggestedText ?? "";
// }

/**
 * aiService.js — Режим заглушек (Mocks) для локальной разработки без траты API-кредитов.
 */

// Заглушка для Промпты №1: Возвращает 3 вопроса и структуру карточки
export async function generateClarifyingQuestions(rawDescription) {
  // Имитируем реальную задержку ответа сервера в 600 мс
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    questions: [
      "Каковы основные сроки реализации и ограничения по технологиям?",
      "Кто является конечным пользователем данного решения?",
      "Какие измеримые критерии успеха и ожидаемый результат проекта?"
    ],
    extractedFields: {
      title: rawDescription.length > 35 
        ? rawDescription.slice(0, 35) + "..." 
        : rawDescription || "Новая бизнес-задача",
      context: rawDescription
    }
  };
}

// Заглушка для Промпты №2: Возвращает вариант для пустых полей ("✨ AI Подсказка")
export async function generateFieldSuggestion(fieldName, currentContext) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const mockSuggestions = {
    expectedResult: "Работающий веб-сервис MVP с каталогом задач и анимированной системой рейтинга готовности.",
    successCriteria: "Пользователь за 3 минуты составляет ТЗ и получает рейтинг карточки выше 70 баллов.",
    constraints: "Срок разработки: 2 недели. Стек технологий: React, Node.js, Tailwind CSS.",
    users: "Студенты IT-специальностей, вузы и представители малого/среднего бизнеса.",
    contacts: "Telegram: @business_owner, Email: partner@company.kz",
    data: "Примеры существующих ТЗ в формате JSON, синтетическая база карточек и откликов."
  };

  return mockSuggestions[fieldName] || "Сгенерированные уточненные данные на основе контекста задачи.";
}