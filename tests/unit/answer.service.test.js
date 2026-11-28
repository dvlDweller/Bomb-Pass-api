// Unit tests for answer submission.
// Repository and Sequelize calls are mocked, so these tests do not touch a database.
jest.mock('../../src/repositories/game-session.repository');
jest.mock('../../src/repositories/question.repository');
jest.mock('../../src/repositories/answer.repository');
jest.mock('../../src/repositories/session-question-history.repository');
jest.mock('../../src/models', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };
  return {
    sequelize: {
      transaction: jest.fn(async () => transaction),
    },
  };
});

const gameSessionRepository = require('../../src/repositories/game-session.repository');
const questionRepository = require('../../src/repositories/question.repository');
const answerRepository = require('../../src/repositories/answer.repository');
const sessionQuestionHistoryRepository = require('../../src/repositories/session-question-history.repository');
const { submitAnswer } = require('../../src/services/answer.service');

describe('answer.service submitAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makePlayer(overrides = {}) {
    return {
      player_id: 7,
      user_id: 1,
      player_status: 'ACTIVE',
      score: 0,
      increment: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  function makeSession(overrides = {}) {
    return {
      session_id: 10,
      join_code: '123456',
      status: 'playing',
      current_question_id: 101,
      current_cycle_number: 1,
      question_started_at: new Date(Date.now() - 1000),
      ...overrides,
    };
  }

  function makeQuestion() {
    return {
      question_id: 101,
      time_limit_seconds: 10,
      correct_index: 1,
      choices: [
        { choice_id: 1, choice_index: 0, text: 'Green' },
        { choice_id: 2, choice_index: 1, text: 'Blue' },
      ],
    };
  }

  test('records CORRECT and awards 10 points', async () => {
    const session = makeSession();
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: session.question_started_at });
    answerRepository.createAnswer.mockResolvedValue({ answer_id: 1, answer_status: 'CORRECT', elapsed_ms: 1000 });

    const result = await submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 });

    expect(result.answer_status).toBe('CORRECT');
    expect(result.elapsed_ms).toBeGreaterThanOrEqual(0);
    expect(answerRepository.createAnswer).toHaveBeenCalledWith(expect.objectContaining({
      player_id: 7,
      occurrence_id: 5,
      question_id: 101,
      choice_id: 2,
      answer_status: 'CORRECT',
    }), { transaction: expect.any(Object) });
    expect(player.increment).toHaveBeenCalledWith('score', { by: 10, transaction: expect.any(Object) });
  });

  test('records INCORRECT and awards 0 points', async () => {
    const session = makeSession();
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: session.question_started_at });
    answerRepository.createAnswer.mockResolvedValue({ answer_id: 2, answer_status: 'INCORRECT', elapsed_ms: 1000 });

    const result = await submitAnswer('123456', { question_id: 101, choice_id: 1 }, { user_id: 1 });

    expect(result.answer_status).toBe('INCORRECT');
    expect(player.increment).not.toHaveBeenCalled();
  });

  test('returns SESSION_NOT_FOUND for an unknown session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(null);
    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('returns SESSION_ENDED for an ended session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession({ status: 'ended' }));
    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'SESSION_ENDED' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('returns SESSION_NOT_PLAYING for a waiting session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession({ status: 'waiting' }));
    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'SESSION_NOT_PLAYING' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('returns FORBIDDEN when the caller has no seat', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
    gameSessionRepository.findPlayerSeat.mockResolvedValue(null);
    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('returns FORBIDDEN for a JOINED seat', async () => {
    const player = makePlayer({ player_status: 'JOINED' });
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('allows a disconnected ACTIVE seat to answer', async () => {
    const player = makePlayer({ connection_status: 'DISCONNECTED' });
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: makeSession().question_started_at });
    answerRepository.createAnswer.mockResolvedValue({ answer_id: 3, answer_status: 'CORRECT', elapsed_ms: 10 });

    await submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 });

    expect(answerRepository.createAnswer).toHaveBeenCalled();
  });

  test('rejects ELIMINATED, FORFEITED, and FINISHED seats', async () => {
    for (const status of ['ELIMINATED', 'FORFEITED', 'FINISHED']) {
      const player = makePlayer({ player_status: status });
      gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
      gameSessionRepository.findPlayerSeat.mockResolvedValue(player);

      await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(answerRepository.createAnswer).not.toHaveBeenCalled();
    }
  });

  test('returns NOT_CURRENT_QUESTION for the wrong question', async () => {
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);

    await expect(submitAnswer('123456', { question_id: 999, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'NOT_CURRENT_QUESTION' });
    expect(questionRepository.findById).not.toHaveBeenCalled();
  });

  test('returns INVALID_CHOICE for a choice from another question', async () => {
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 999 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'INVALID_CHOICE' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('returns NO_ACTIVE_QUESTION when occurrence is missing', async () => {
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession());
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue(null);

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'NO_ACTIVE_QUESTION' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('returns NO_ACTIVE_QUESTION when question_started_at is invalid', async () => {
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession({ question_started_at: null }));
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: new Date() });

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'NO_ACTIVE_QUESTION' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('rejects a late request and does not create a TIMEOUT row', async () => {
    const startedAt = new Date(Date.now() - 20000);
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession({ question_started_at: startedAt }));
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: startedAt });

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toMatchObject({ code: 'NO_ACTIVE_QUESTION' });
    expect(answerRepository.createAnswer).not.toHaveBeenCalled();
  });

  test('uses server-derived elapsed time, not client input', async () => {
    const startedAt = new Date(Date.now() - 500);
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(makeSession({ question_started_at: startedAt }));
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: startedAt });
    answerRepository.createAnswer.mockResolvedValue({ answer_id: 4, answer_status: 'CORRECT', elapsed_ms: 500 });

    await submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 });

    const createdAnswer = answerRepository.createAnswer.mock.calls[0][0];
    expect(createdAnswer.elapsed_ms).toBeGreaterThanOrEqual(0);
    expect(createdAnswer.elapsed_ms).toBeLessThan(10000);
  });

  test('rolls back when answer creation fails', async () => {
    const session = makeSession();
    const player = makePlayer();
    const { sequelize } = require('../../src/models');
    const transaction = await sequelize.transaction();
    transaction.commit.mockClear();
    transaction.rollback.mockClear();

    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: session.question_started_at });
    answerRepository.createAnswer.mockRejectedValue(new Error('insert failed'));

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toThrow('insert failed');
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(player.increment).not.toHaveBeenCalled();
  });

  test('rolls back when score increment fails', async () => {
    const session = makeSession();
    const player = makePlayer();
    player.increment.mockRejectedValue(new Error('increment failed'));
    const { sequelize } = require('../../src/models');
    const transaction = await sequelize.transaction();
    transaction.commit.mockClear();
    transaction.rollback.mockClear();

    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: session.question_started_at });
    answerRepository.createAnswer.mockResolvedValue({ answer_id: 6, answer_status: 'CORRECT', elapsed_ms: 100 });

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toThrow('increment failed');
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  test('maps a duplicate unique constraint to a 409 conflict', async () => {
    const session = makeSession();
    const player = makePlayer();
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.findPlayerSeat.mockResolvedValue(player);
    questionRepository.findById.mockResolvedValue(makeQuestion());
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ occurrence_id: 5, displayed_at: session.question_started_at });
    const { UniqueConstraintError } = require('sequelize');
    const duplicateError = new UniqueConstraintError({
      errors: [],
      fields: {},
      parent: { constraint: 'uq_answers_player_question' },
    });
    answerRepository.createAnswer.mockRejectedValue(duplicateError);

    await expect(submitAnswer('123456', { question_id: 101, choice_id: 2 }, { user_id: 1 }))
      .rejects.toBe(duplicateError);

    const errorHandler = require('../../src/middlewares/error-handler');
    const constraintMap = require('../../src/errors/constraint-map');
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    errorHandler(duplicateError, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'ANSWER_ALREADY_SUBMITTED', message: constraintMap.uq_answers_player_question.message } });
  });
});