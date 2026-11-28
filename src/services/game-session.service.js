// Game session business rules and authorization.
// The service receives the authenticated user, never req or res.
const crypto = require('crypto');
const { UniqueConstraintError } = require('sequelize');
const gameSessionRepository = require('../repositories/game-session.repository');
const questionRepository = require('../repositories/question.repository');
const sessionQuestionHistoryRepository = require('../repositories/session-question-history.repository');
const questionSetService = require('./question-set.service');
const { sequelize } = require('../models');
const { notFound, forbidden, conflict } = require('../errors/app-error');
const { constraintOf } = require('../errors/db-errors');
const gameInfo = require('../config/game-info');
const { rankPlayers } = require('../utils/rank-players');

const MAX_CODE_ATTEMPTS = 5;
const JOIN_CODE_COLLISION_INDEX = 'game_sessions_join_code_open_unique';
const ALLOWED_ROLES = ['HOST', 'ADMIN'];

const VALID_TRANSITIONS = {
  waiting: ['playing', 'ended'],
  playing: ['ended'],
};

function isHostOrAdmin(user) {
  return ALLOWED_ROLES.includes(user.role);
}

async function create(user, values) {
  if (!isHostOrAdmin(user)) {
    throw forbidden('Only a host or admin can create a session.');
  }

  const questionSet = await questionSetService.get(values.question_set_id, user);

  const payload = {
    question_set_id: questionSet.question_set_id,
    host_user_id: user.user_id,
    status: 'waiting',
    duration_limit_minutes: values.duration_limit_minutes ?? 10,
    bomb_time_limit_seconds: values.bomb_time_limit_seconds ?? 30,
  };

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const join_code = crypto.randomInt(100000, 1000000).toString();
      return await gameSessionRepository.create({ ...payload, join_code });
    } catch (err) {
      if (
        err instanceof UniqueConstraintError &&
        constraintOf(err) === JOIN_CODE_COLLISION_INDEX
      ) {
        continue;
      }
      throw err;
    }
  }

  throw conflict('SESSION_CODE_UNAVAILABLE', 'Unable to allocate a unique join code. Please try again.');
}

async function get(code) {
  const session = await gameSessionRepository.findByJoinCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
  }
  return session;
}

async function getCurrentQuestion(code) {
  const session = await gameSessionRepository.findByJoinCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
  }
  if (session.status === 'ended') {
    throw conflict('SESSION_ENDED', 'This session has ended.');
  }
  if (session.status !== 'playing') {
    throw conflict('SESSION_NOT_PLAYING', 'This session is not currently playing.');
  }
  if (!session.current_question_id) {
    throw conflict('NO_CURRENT_QUESTION', 'This session does not have a current question.');
  }

  const question = await questionRepository.findById(session.current_question_id);
  if (!question) {
    throw notFound('QUESTION_NOT_FOUND', `Question ${session.current_question_id} not found.`);
  }

  return question;
}

async function changeStatus(code, newStatus, user) {
  const transaction = await sequelize.transaction();
  try {
    const session = await gameSessionRepository.findByJoinCode(code, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!session) {
      throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
    }

    if (user.role !== 'ADMIN' && session.host_user_id !== user.user_id) {
      throw forbidden('Only the session host or an admin can change its status.');
    }

    if (session.status === newStatus) {
      throw conflict('REDUNDANT_STATUS', `Session is already ${newStatus}.`);
    }

    if (session.status === 'ended') {
      throw conflict('SESSION_ENDED', 'Cannot change the status of an ended session.');
    }

    const allowed = VALID_TRANSITIONS[session.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw conflict('INVALID_TRANSITION', `Cannot transition from ${session.status} to ${newStatus}.`);
    }

    const changes = { status: newStatus };
    if (newStatus === 'playing') {
      const questions = await questionRepository.listByQuestionSet(session.question_set_id, { transaction });
      if (questions.length === 0) {
        throw conflict('QUESTION_SET_EMPTY', 'This session cannot start because its question set has no questions.');
      }
      const startedAt = new Date();
      const firstQuestion = questions[0];
      let occurrence = await sessionQuestionHistoryRepository.findOccurrence(
        session.session_id,
        1,
        firstQuestion.question_id,
        { transaction }
      );
      if (!occurrence) {
        occurrence = await sessionQuestionHistoryRepository.createOccurrence(
          {
            session_id: session.session_id,
            cycle_number: 1,
            question_id: firstQuestion.question_id,
            displayed_at: startedAt,
          },
          { transaction }
        );
      }

      changes.started_at = startedAt;
      changes.current_position = 1;
      changes.current_cycle_number = 1;
      changes.current_question_id = firstQuestion.question_id;
      changes.question_started_at = occurrence.displayed_at;

      await gameSessionRepository.activateJoinedPlayers(session.session_id, { transaction });
    }
    if (newStatus === 'ended') {
      const endedAt = new Date();
      changes.ended_at = endedAt;
      changes.session_end_reason = 'host_ended';
      changes.winner_player_id = null;
      await gameSessionRepository.finalizeActivePlayers(session.session_id, endedAt, { transaction });
      const players = await gameSessionRepository.findPlayersForFinalRanking(session.session_id, { transaction });
      const ranks = calculateFinalRanks(players, null);
      await gameSessionRepository.setFinalRanks(session.session_id, ranks, { transaction });
    }

    const updated = await gameSessionRepository.update(session, changes, { transaction });
    await transaction.commit();
    return updated;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function advancePosition(code, requestedPosition, user) {
  const transaction = await sequelize.transaction();
  try {
    const session = await gameSessionRepository.findByJoinCode(code, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!session) {
      throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
    }

    if (user.role !== 'ADMIN' && session.host_user_id !== user.user_id) {
      throw forbidden('Only the session host or an admin can change its status.');
    }

    if (session.status === 'ended') {
      throw conflict('SESSION_ENDED', 'Cannot change the status of an ended session.');
    }
    if (session.status !== 'playing') {
      throw conflict('SESSION_NOT_PLAYING', 'This session is not currently playing.');
    }

    const questions = await questionRepository.listByQuestionSet(session.question_set_id, { transaction });
    if (questions.length === 0) {
      throw conflict('QUESTION_SET_EMPTY', 'This session cannot progress because its question set has no questions.');
    }

    const nextPosition = session.current_position + 1;
    if (session.current_position >= questions.length) {
      throw conflict('NO_MORE_QUESTIONS', 'There are no more questions.');
    }
    if (requestedPosition !== nextPosition) {
      throw conflict('NOT_NEXT_QUESTION', 'Only the next question can be selected.');
    }

    const nextQuestion = questions[requestedPosition - 1];
    let occurrence = await sessionQuestionHistoryRepository.findOccurrence(
      session.session_id,
      session.current_cycle_number,
      nextQuestion.question_id,
      { transaction }
    );
    if (!occurrence) {
      occurrence = await sessionQuestionHistoryRepository.createOccurrence(
        {
          session_id: session.session_id,
          cycle_number: session.current_cycle_number,
          question_id: nextQuestion.question_id,
          displayed_at: new Date(),
        },
        { transaction }
      );
    }

    const updated = await gameSessionRepository.update(session, {
      current_position: requestedPosition,
      current_question_id: nextQuestion.question_id,
      question_started_at: occurrence.displayed_at,
    }, { transaction });
    await transaction.commit();
    return updated;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function joinOrRejoin(code, nickname, user) {
  const session = await gameSessionRepository.findByJoinCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
  }

  const existingSeat = await gameSessionRepository.findPlayerSeat(
    session.session_id,
    user.user_id
  );
  if (existingSeat) {
    await gameSessionRepository.markSeen(existingSeat);
    return { session, player: existingSeat, created: false, rejoined: true };
  }

  const runningElsewhere = await gameSessionRepository.findRunningSeatElsewhere(
    user.user_id,
    session.session_id
  );
  if (runningElsewhere) {
    throw conflict(
      'ALREADY_IN_GAME',
      'You are still playing another game. Finish it first.'
    );
  }

  if (session.status === 'ended') {
    throw conflict('SESSION_ENDED', 'This session has ended and cannot be joined.');
  }
  if (session.status !== 'waiting') {
    throw conflict('SESSION_NOT_JOINABLE', 'This session is not currently joinable.');
  }

  const playerCount = await gameSessionRepository.countPlayers(session.session_id);
  if (playerCount >= gameInfo.max_players) {
    throw conflict('SESSION_FULL', 'This session has reached its maximum capacity.');
  }

  const player = await gameSessionRepository.createPlayer({
    session_id: session.session_id,
    user_id: user.user_id,
    nickname,
  });

  return { session, player, created: true, rejoined: false };
}

async function listPlayers(code) {
  const session = await gameSessionRepository.findByJoinCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
  }
  return gameSessionRepository.listPlayers(session.session_id);
}

function calculateFinalRanks(players, winnerPlayerId = null) {
  const byId = new Map((players || []).map((p) => [p.player_id, p]));
  const ordered = [];
  if (winnerPlayerId != null && byId.has(winnerPlayerId)) {
    ordered.push(byId.get(winnerPlayerId));
  }
  const participating = (players || []).filter(
    (p) => p.player_id !== winnerPlayerId && (p.player_status === 'FINISHED' || p.player_status === 'ACTIVE')
  );
  participating.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = a.penalty_count == null ? 0 : Number(a.penalty_count);
    const pb = b.penalty_count == null ? 0 : Number(b.penalty_count);
    if (pa !== pb) return pa - pb;
    const ja = a.joined_at ? new Date(a.joined_at).getTime() : 0;
    const jb = b.joined_at ? new Date(b.joined_at).getTime() : 0;
    if (ja !== jb) return ja - jb;
    return a.player_id - b.player_id;
  });
  ordered.push(...participating);
  const eliminated = (players || [])
    .filter((p) => p.player_status === 'ELIMINATED')
    .sort((a, b) => new Date(b.eliminated_at || 0) - new Date(a.eliminated_at || 0));
  ordered.push(...eliminated);
  const forfeited = (players || [])
    .filter((p) => p.player_status === 'FORFEITED')
    .sort((a, b) => new Date(b.forfeited_at || 0) - new Date(a.forfeited_at || 0));
  ordered.push(...forfeited);
  const joined = (players || [])
    .filter((p) => p.player_status === 'JOINED')
    .sort((a, b) => {
      const ja = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const jb = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      if (ja !== jb) return ja - jb;
      return a.player_id - b.player_id;
    });
  ordered.push(...joined);
  return ordered.map((p, i) => ({ player_id: p.player_id, final_rank: i + 1 }));
}

async function leaderboard(code, limit) {
  const session = await gameSessionRepository.findByJoinCode(code);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
  }
  const rows = await gameSessionRepository.listPlayersByScore(session.session_id, limit);
  const mapped = rows.map((r) => ({
    nickname: r.nickname,
    score: Number(r.score),
    player_status: r.player_status,
    penalty_count: Number(r.penalty_count),
    joined_at: r.joined_at,
    player_id: r.player_id,
  }));
  const ranked = rankPlayers(mapped);
  return ranked.map(({ rank, nickname, score, player_status }) => ({
    rank,
    nickname,
    score,
    player_status,
  }));
}
module.exports = { create, get, getCurrentQuestion, changeStatus, advancePosition, joinOrRejoin, listPlayers, leaderboard, calculateFinalRanks };
