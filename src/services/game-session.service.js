// Game session business rules and authorization.
// The service receives the authenticated user, never req or res.
const crypto = require('crypto');
const { UniqueConstraintError } = require('sequelize');
const gameSessionRepository = require('../repositories/game-session.repository');
const questionSetService = require('./question-set.service');
const { notFound, forbidden, conflict } = require('../errors/app-error');
const { constraintOf } = require('../errors/db-errors');
const gameInfo = require('../config/game-info');

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

async function changeStatus(code, newStatus, user) {
  const session = await gameSessionRepository.findByJoinCode(code);
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
    changes.started_at = new Date();
  }
  if (newStatus === 'ended') {
    changes.ended_at = new Date();
    changes.session_end_reason = 'host_ended';
  }

  return gameSessionRepository.update(session, changes);
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

module.exports = { create, get, changeStatus, joinOrRejoin, listPlayers };
