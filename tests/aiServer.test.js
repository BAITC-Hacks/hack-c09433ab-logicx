import test from 'node:test';
import assert from 'node:assert/strict';
import { runAi, aiMiddleware } from '../server/ai.js';
import { createServer } from 'node:http';
const payload = { action: 'questions', description: 'Кофейня: учёт остатков' };
const answer = { questions: ['Какие данные?', 'Какой результат?', 'Какие сроки?'], questionFields: ['dataAvailable','expectedResult','constraints'], extractedFields: { title: 'Учёт остатков', context: 'Кофейня' } };
const okFetch = async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }) });
test('server parses structured responses and sends key only upstream', async () => {
  let sent;
  const result = await runAi(payload, { apiKey: 'test-secret', fetchImpl: async (url, options) => { sent = { url, ...options }; return okFetch(); } });
  assert.equal(sent.url, 'https://api.openai.com/v1/responses');
  assert.equal(sent.headers.Authorization, 'Bearer test-secret');
  assert.equal(JSON.parse(sent.body).store, false);
  assert.deepEqual(result, answer);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});
test('upstream errors are sanitized and quota gets useful message', async () => {
  for (const [status, code, expected] of [[401,'invalid_api_key',/отклонил ключ/],[429,'insufficient_quota',/кредитов/],[403,'denied',/доступа/],[500,'server_error',/не смог/]]) {
    await assert.rejects(runAi(payload, { apiKey: 'secret', fetchImpl: async () => ({ ok: false, status, json: async () => ({ error: { code, message: 'secret' } }) }) }), error => expected.test(error.message) && !error.message.includes('secret'));
  }
});
test('invalid input, missing key, malformed responses and insufficient facts are handled', async () => {
  await assert.rejects(runAi(payload, {}), /не задан/);
  await assert.rejects(runAi({ action: 'questions', description: '' }, { apiKey: 'test' }), /Описание/);
  await assert.rejects(runAi(payload, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ status: 'incomplete' }) }) }), /некорректный/);
  await assert.rejects(runAi({ action: 'suggestion', field: 'contact', context: {} }, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ needsInformation: true, suggestedText: '', explanation: 'Укажите контакт бизнеса.' }) }] }] }) }) }), error => error.status === 422);
});
test('HTTP endpoint validates method, origin and JSON, and returns structured output', async () => {
  const handler = aiMiddleware({ apiKey: 'test', fetchImpl: okFetch });
  const server = createServer((req,res) => handler(req,res,() => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/ai`;
  try {
    assert.equal((await fetch(url)).status, 405);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:'{}'})).status,403);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'not-json'})).status,400);
    const result = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    assert.equal(result.status,200);
    assert.deepEqual(await result.json(),answer);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
