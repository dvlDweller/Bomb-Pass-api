// Unit tests for answer controller serialization.
// The answer service is mocked, so these tests do not touch a database.
jest.mock('../../src/services/answer.service');
jest.mock('express-validator', () => ({
  matchedData: jest.fn((req, options) => {
    if (options && options.locations && options.locations[0] === 'params') {
      return { code: '123456' };
    }
    return { question_id: 101, choice_id: 2 };
  }),
}));

const answerService = require('../../src/services/answer.service');
const answerController = require('../../src/controllers/answer.controller');
const { matchedData } = require('express-validator');

describe('answer.controller.submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns only the approved answer DTO fields', async () => {
    const answer = {
      answer_id: 1,
      question_id: 101,
      choice_id: 2,
      answer_status: 'CORRECT',
      elapsed_ms: 123,
      submitted_at: '2026-11-26T10:00:00.000Z',
      correct_index: 1,
      is_correct: true,
      password_hash: 'secret-hash',
      player_id: 7,
      session_id: 10,
      occurrence_id: 5,
      internal: { secret: 'nested-secret' },
    };
    const expectedAnswer = {
      answer_id: 1,
      question_id: 101,
      choice_id: 2,
      answer_status: 'CORRECT',
      elapsed_ms: 123,
      submitted_at: '2026-11-26T10:00:00.000Z',
    };
    answerService.submitAnswer.mockResolvedValue(answer);

    const req = {
      params: { code: '123456' },
      body: { question_id: 101, choice_id: 2 },
      user: { user_id: 7 },
    };
    let responseBody;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((body) => {
        responseBody = body;
      }),
    };

    await answerController.submit(req, res);

    expect(answerService.submitAnswer).toHaveBeenCalledWith('123456', { question_id: 101, choice_id: 2 }, { user_id: 7 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(responseBody).toEqual({ answer: expectedAnswer });
    expect(responseBody.answer).not.toHaveProperty('correct_index');
    expect(responseBody.answer).not.toHaveProperty('is_correct');
    expect(responseBody.answer).not.toHaveProperty('password_hash');
    expect(responseBody.answer).not.toHaveProperty('player_id');
    expect(responseBody.answer).not.toHaveProperty('session_id');
    expect(responseBody.answer).not.toHaveProperty('occurrence_id');
    expect(responseBody.answer).not.toHaveProperty('internal');
  });
});