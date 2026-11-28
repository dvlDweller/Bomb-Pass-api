// Unit tests for answer request validation.
// These tests do not touch a database.
const express = require('express');
const { validationResult } = require('express-validator');
const { answerRules } = require('../../src/validators/answer.validator');

function createApp() {
  const app = express();
  app.use(express.json());
  app.post('/answers', answerRules, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array().map((item) => item.msg) });
    }
    res.status(200).json({ matched: req.body });
  });
  return app;
}

describe('answer validator', () => {
  let server;
  let baseUrl;

  beforeAll((done) => {
    server = createApp().listen(0, () => {
      baseUrl = 'http://127.0.0.1:' + server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  async function post(body) {
    const response = await fetch(baseUrl + '/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  test('accepts exactly two numeric ID fields', async () => {
    const result = await post({ question_id: 1, choice_id: 2 });
    expect(result.status).toBe(200);
    expect(result.body.matched).toEqual({ question_id: 1, choice_id: 2 });
  });

  test('rejects missing fields', async () => {
    const result = await post({ question_id: 1 });
    expect(result.status).toBe(400);
  });

  test('rejects numeric strings', async () => {
    const result = await post({ question_id: '1', choice_id: 2 });
    expect(result.status).toBe(400);
  });

  test('rejects zero and negative IDs', async () => {
    const result = await post({ question_id: 0, choice_id: -1 });
    expect(result.status).toBe(400);
  });

  test('rejects extra fields', async () => {
    const result = await post({ question_id: 1, choice_id: 2, elapsed_ms: 10 });
    expect(result.status).toBe(400);
  });

  test('rejects null values', async () => {
    const result = await post({ question_id: null, choice_id: 2 });
    expect(result.status).toBe(400);
  });
});