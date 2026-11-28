// Unit tests for game-session status transitions and progression.
// Repository and Sequelize calls are mocked, so these tests do not touch a database.
jest.mock('../../src/repositories/game-session.repository');
jest.mock('../../src/repositories/question.repository');
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
const sessionQuestionHistoryRepository = require('../../src/repositories/session-question-history.repository');
const { changeStatus, advancePosition } = require('../../src/services/game-session.service');

describe('game-session changeStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes a waiting session when it starts playing', async () => {
    const session = { status: 'waiting', host_user_id: 1, session_id: 10, question_set_id: 10, current_position: null };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockResolvedValue({ ...session, status: 'playing' });
    gameSessionRepository.activateJoinedPlayers.mockResolvedValue([1]);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 42 }]);
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue(null);
    sessionQuestionHistoryRepository.createOccurrence.mockImplementation((values) => ({ displayed_at: values.displayed_at }));

    const user = { user_id: 1, role: 'HOST' };
    await changeStatus('123456', 'playing', user);

    expect(gameSessionRepository.findByJoinCode).toHaveBeenCalledWith('123456', {
      transaction: expect.any(Object),
      lock: 'UPDATE',
    });
    expect(questionRepository.listByQuestionSet).toHaveBeenCalledWith(10, { transaction: expect.any(Object) });
    expect(sessionQuestionHistoryRepository.findOccurrence).toHaveBeenCalledWith(10, 1, 42, { transaction: expect.any(Object) });
    expect(sessionQuestionHistoryRepository.createOccurrence).toHaveBeenCalledWith(
      {
        session_id: 10,
        cycle_number: 1,
        question_id: 42,
        displayed_at: expect.any(Date),
      },
      { transaction: expect.any(Object) }
    );
    expect(gameSessionRepository.activateJoinedPlayers).toHaveBeenCalledWith(10, { transaction: expect.any(Object) });
    expect(gameSessionRepository.update).toHaveBeenCalledTimes(1);
    const changes = gameSessionRepository.update.mock.calls[0][1];
    expect(changes).toMatchObject({
      status: 'playing',
      current_position: 1,
      current_cycle_number: 1,
      current_question_id: 42,
    });
    expect(changes.started_at).toBeInstanceOf(Date);
    expect(changes.question_started_at).toBe(changes.started_at);
  });

  test('reuses an existing occurrence when starting a session', async () => {
    const existingDisplayedAt = new Date('2026-11-26T10:00:00.000Z');
    const session = { status: 'waiting', host_user_id: 1, session_id: 10, question_set_id: 10, current_position: null };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockResolvedValue({ ...session, status: 'playing' });
    gameSessionRepository.activateJoinedPlayers.mockResolvedValue([1]);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 42 }]);
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue({ displayed_at: existingDisplayedAt });

    const user = { user_id: 1, role: 'HOST' };
    await changeStatus('123456', 'playing', user);

    expect(sessionQuestionHistoryRepository.createOccurrence).not.toHaveBeenCalled();
    const changes = gameSessionRepository.update.mock.calls[0][1];
    expect(changes.question_started_at).toBe(existingDisplayedAt);
  });

  test('activates only JOINED seats and preserves other statuses', async () => {
    const session = { status: 'waiting', host_user_id: 1, session_id: 10, question_set_id: 10, current_position: null };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockResolvedValue({ ...session, status: 'playing' });
    gameSessionRepository.activateJoinedPlayers.mockResolvedValue([1]);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 42 }]);
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue(null);
    sessionQuestionHistoryRepository.createOccurrence.mockImplementation((values) => ({ displayed_at: values.displayed_at }));

    const user = { user_id: 1, role: 'HOST' };
    await changeStatus('123456', 'playing', user);

    expect(gameSessionRepository.activateJoinedPlayers).toHaveBeenCalledWith(10, { transaction: expect.any(Object) });
  });

  test('rolls back activation if session initialization fails', async () => {
    const session = { status: 'waiting', host_user_id: 1, session_id: 10, question_set_id: 10, current_position: null };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockRejectedValue(new Error('update failed'));
    gameSessionRepository.activateJoinedPlayers.mockResolvedValue([1]);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 42 }]);
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue(null);
    sessionQuestionHistoryRepository.createOccurrence.mockImplementation((values) => ({ displayed_at: values.displayed_at }));

    const { sequelize } = require('../../src/models');
    const transaction = await sequelize.transaction();
    transaction.commit.mockClear();
    transaction.rollback.mockClear();

    const user = { user_id: 1, role: 'HOST' };
    await expect(changeStatus('123456', 'playing', user)).rejects.toThrow('update failed');
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  test('does not update a session on a redundant status change', async () => {
    const session = { status: 'playing', host_user_id: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);

    const user = { user_id: 1, role: 'HOST' };
    await expect(changeStatus('123456', 'playing', user)).rejects.toMatchObject({ code: 'REDUNDANT_STATUS' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('does not reset initialization fields when ending a playing session', async () => {
    const session = { status: 'playing', host_user_id: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockResolvedValue({ ...session, status: 'ended' });

    const user = { user_id: 1, role: 'HOST' };
    await changeStatus('123456', 'ended', user);

    const changes = gameSessionRepository.update.mock.calls[0][1];
    expect(changes).toMatchObject({
      status: 'ended',
      session_end_reason: 'host_ended',
    });
    expect(changes).not.toHaveProperty('started_at');
    expect(changes).not.toHaveProperty('current_position');
    expect(changes).not.toHaveProperty('question_started_at');
  });

  test('rejects a non-host, non-admin user', async () => {
    const session = { status: 'waiting', host_user_id: 2 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);

    const user = { user_id: 1, role: 'PLAYER' };
    await expect(changeStatus('123456', 'playing', user)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects changing an ended session', async () => {
    const session = { status: 'ended', host_user_id: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);

    const user = { user_id: 1, role: 'HOST' };
    await expect(changeStatus('123456', 'playing', user)).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects starting a session with no questions', async () => {
    const session = { status: 'waiting', host_user_id: 1, session_id: 10, question_set_id: 10, current_position: null };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    questionRepository.listByQuestionSet.mockResolvedValue([]);

    const user = { user_id: 1, role: 'HOST' };
    await expect(changeStatus('123456', 'playing', user)).rejects.toMatchObject({ code: 'QUESTION_SET_EMPTY' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });
});

describe('game-session advancePosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('advances to the next question with a server-generated timestamp', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockResolvedValue({ ...session, current_position: 2 });
    questionRepository.listByQuestionSet.mockResolvedValue([
      { question_id: 101 },
      { question_id: 102 },
    ]);
    sessionQuestionHistoryRepository.findOccurrence.mockResolvedValue(null);
    sessionQuestionHistoryRepository.createOccurrence.mockImplementation((values) => ({ displayed_at: values.displayed_at }));

    const user = { user_id: 1, role: 'HOST' };
    await advancePosition('123456', 2, user);

    expect(gameSessionRepository.findByJoinCode).toHaveBeenCalledWith('123456', {
      transaction: expect.any(Object),
      lock: 'UPDATE',
    });
    expect(questionRepository.listByQuestionSet).toHaveBeenCalledWith(10, { transaction: expect.any(Object) });
    expect(gameSessionRepository.update).toHaveBeenCalledWith(session, {
      current_position: 2,
      current_question_id: 102,
      question_started_at: expect.any(Date),
    }, { transaction: expect.any(Object) });
  });

  test('rejects the same position', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 101 }, { question_id: 102 }]);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 1, user)).rejects.toMatchObject({ code: 'NOT_NEXT_QUESTION' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects a skipped position', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 101 }, { question_id: 102 }, { question_id: 103 }]);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 3, user)).rejects.toMatchObject({ code: 'NOT_NEXT_QUESTION' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects an earlier position', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 2 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 101 }, { question_id: 102 }, { question_id: 103 }]);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 1, user)).rejects.toMatchObject({ code: 'NOT_NEXT_QUESTION' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects advancement after the final question', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 2 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 101 }, { question_id: 102 }]);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 3, user)).rejects.toMatchObject({ code: 'NO_MORE_QUESTIONS' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects advancement on an ended session', async () => {
    const session = { status: 'ended', host_user_id: 1, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 2, user)).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects progression when the question set is empty', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    questionRepository.listByQuestionSet.mockResolvedValue([]);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 2, user)).rejects.toMatchObject({ code: 'QUESTION_SET_EMPTY' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects advancement on a waiting session', async () => {
    const session = { status: 'waiting', host_user_id: 1, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 2, user)).rejects.toMatchObject({ code: 'SESSION_NOT_PLAYING' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects a non-host, non-admin user', async () => {
    const session = { status: 'playing', host_user_id: 2, question_set_id: 10, current_position: 1 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);

    const user = { user_id: 1, role: 'PLAYER' };
    await expect(advancePosition('123456', 2, user)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rejects an unknown session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(null);

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 2, user)).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
    expect(gameSessionRepository.update).not.toHaveBeenCalled();
  });

  test('rolls back when the update fails', async () => {
    const session = { status: 'playing', host_user_id: 1, question_set_id: 10, current_position: 1 };
    const { sequelize } = require('../../src/models');
    const transaction = await sequelize.transaction();
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockRejectedValue(new Error('update failed'));
    questionRepository.listByQuestionSet.mockResolvedValue([{ question_id: 101 }, { question_id: 102 }]);

    transaction.commit.mockClear();
    transaction.rollback.mockClear();

    const user = { user_id: 1, role: 'HOST' };
    await expect(advancePosition('123456', 2, user)).rejects.toThrow('update failed');
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });
});