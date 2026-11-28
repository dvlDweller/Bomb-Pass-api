// Unit tests for leaderboard query validation.
const express = require('express');
const { validationResult } = require('express-validator');
const { limitRules } = require('../../src/validators/leaderboard.validator');

function createApp() {
  const app = express();
  app.get('/:code/leaderboard', limitRules, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array().map((item) => item.msg) });
    }
    res.status(200).json({ ok: true });
  });
  return app;
}

describe('leaderboard validator', () => {
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

  async function get(limit) {
    const url = baseUrl + '/123456/leaderboard' + (limit === undefined ? '' : '?limit=' + encodeURIComponent(limit));
    const response = await fetch(url);
    return { status: response.status, body: await response.json() };
  }

  test('accepts missing limit', async () => {
    const result = await get(undefined);
    expect(result.status).toBe(200);
  });

  test('accepts limit=1', async () => {
    const result = await get(1);
    expect(result.status).toBe(200);
  });

  test('accepts limit=10', async () => {
    const result = await get(10);
    expect(result.status).toBe(200);
  });

  test('accepts limit=50', async () => {
    const result = await get(50);
    expect(result.status).toBe(200);
  });

  test('rejects limit=0', async () => {
    const result = await get(0);
    expect(result.status).toBe(400);
  });

  test('rejects limit=-1', async () => {
    const result = await get(-1);
    expect(result.status).toBe(400);
  });

  test('rejects limit=1.5', async () => {
    const result = await get('1.5');
    expect(result.status).toBe(400);
  });

  test('rejects limit=abc', async () => {
    const result = await get('abc');
    expect(result.status).toBe(400);
  });

  test('rejects limit=51', async () => {
    const result = await get(51);
    expect(result.status).toBe(400);
  });
});
