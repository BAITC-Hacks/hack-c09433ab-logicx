// Explicit live smoke check: two small paid API requests, synthetic data only.
import { createServer } from 'node:http';
import { loadEnv } from 'vite';
import { aiMiddleware } from './ai.js';
const env = loadEnv('development', process.cwd(), 'OPENAI_');
const handler = aiMiddleware({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL || 'gpt-4o-mini' });
const server = createServer((req, res) => handler(req, res, () => { res.writeHead(404); res.end(); }));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  for (const payload of [
    { action: 'questions', description: 'Кофейня хочет учитывать остатки продуктов. Сейчас бариста ведут таблицу Excel.' },
    { action: 'suggestion', field: 'users', context: { context: 'Системой учёта остатков в кофейне будут пользоваться бариста и управляющий.' } },
  ]) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    console.log(JSON.stringify({ action: payload.action, status: response.status, result }));
    if (!response.ok) process.exitCode = 1;
  }
} finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
