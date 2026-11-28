// Unit tests for the current-question endpoint.
// Repository and service calls are mocked, so these tests do not touch a database.
jest.mock('../../src/repositories/game-session.repository');
jest.mock('../../src/repositories/question.repository');

const gameSessionRepository = require('../../src/repositories/game-session.repository');
const questionRepository = require('../../src/repositories/question.repository');
const gameSessionService = require('../../src/services/game-session.service');
const gameSessionController = require('../../src/controllers/game-session.controller');

describe('gameSessionService.getCurrentQuestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the question referenced by the playing session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ status: 'playing', current_question_id: 7 });
    questionRepository.findById.mockResolvedValue({ question_id: 7, text: 'Question', choices: [] });

    const result = await gameSessionService.getCurrentQuestion('123456');

    expect(gameSessionRepository.findByJoinCode).toHaveBeenCalledWith('123456');
    expect(questionRepository.findById).toHaveBeenCalledWith(7);
    expect(result.question_id).toBe(7);
  });

  test('returns SESSION_NOT_FOUND for an unknown session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(null);

    await expect(gameSessionService.getCurrentQuestion('123456')).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
    expect(questionRepository.findById).not.toHaveBeenCalled();
  });

  test('returns SESSION_NOT_PLAYING for a waiting session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ status: 'waiting', current_question_id: 7 });

    await expect(gameSessionService.getCurrentQuestion('123456')).rejects.toMatchObject({
      code: 'SESSION_NOT_PLAYING',
    });
    expect(questionRepository.findById).not.toHaveBeenCalled();
  });

  test('returns SESSION_ENDED for an ended session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ status: 'ended', current_question_id: 7 });

    await expect(gameSessionService.getCurrentQuestion('123456')).rejects.toMatchObject({
      code: 'SESSION_ENDED',
    });
    expect(questionRepository.findById).not.toHaveBeenCalled();
  });

  test('returns NO_CURRENT_QUESTION when current_question_id is missing', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ status: 'playing', current_question_id: null });

    await expect(gameSessionService.getCurrentQuestion('123456')).rejects.toMatchObject({
      code: 'NO_CURRENT_QUESTION',
    });
    expect(questionRepository.findById).not.toHaveBeenCalled();
  });

  test('returns QUESTION_NOT_FOUND when the referenced question is missing', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ status: 'playing', current_question_id: 7 });
    questionRepository.findById.mockResolvedValue(null);

    await expect(gameSessionService.getCurrentQuestion('123456')).rejects.toMatchObject({
      code: 'QUESTION_NOT_FOUND',
    });
  });

  test('does not mutate the session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ status: 'playing', current_question_id: 7 });
    questionRepository.findById.mockResolvedValue({ question_id: 7, text: 'Question', choices: [] });

    await gameSessionService.getCurrentQuestion('123456');

    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });
});

describe('gameSessionController.getCurrentQuestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('serializes only the safe question and choice fields', async () => {
    const question = {
      question_id: 7,
      question_set_id: 3,
      text: 'What color is the sky?',
      type: 'multiple_choice',
      correct_index: 1,
      time_limit_seconds: 10,
      is_correct: true,
      choices: [
        {
          choice_id: 1,
          question_id: 3,
          choice_index: 0,
          text: 'Green',
          is_correct: false,
        },
      ],
    };

    jest.spyOn(gameSessionService, 'getCurrentQuestion').mockResolvedValue(question);

    const req = { params: { code: '123456' } };
    let responseBody;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((body) => {
        responseBody = body;
      }),
    };

    await gameSessionController.getCurrentQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(responseBody).toEqual({
      question: {
        question_id: 7,
        text: 'What color is the sky?',
        type: 'multiple_choice',
        time_limit_seconds: 10,
        choices: [
          {
            choice_id: 1,
            choice_index: 0,
            text: 'Green',
          },
        ],
      },
    });
    expect(responseBody.question).not.toHaveProperty('correct_index');
    expect(responseBody.question).not.toHaveProperty('is_correct');
    expect(responseBody.question).not.toHaveProperty('correct');
    expect(responseBody.question.choices[0]).not.toHaveProperty('correct_index');
    expect(responseBody.question.choices[0]).not.toHaveProperty('is_correct');
    expect(responseBody.question.choices[0]).not.toHaveProperty('correct');
  });
});