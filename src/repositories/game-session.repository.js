// The only layer that queries the GameSession and Player tables.
// Services call this repository, never the model or the database directly.
const { GameSession, Player } = require('../models');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');

async function findByJoinCode(code, options = {}) {
  return GameSession.findOne({
    where: { join_code: code },
    order: [['session_id', 'DESC']],
    transaction: options.transaction,
    lock: options.transaction ? options.lock : undefined,
  });
}

async function create(values) {
  return GameSession.create(values);
}

async function createPlayer(values) {
  return Player.create(values);
}

async function countPlayers(sessionId) {
  return Player.count({ where: { session_id: sessionId } });
}

async function activateJoinedPlayers(sessionId, options = {}) {
  return Player.update(
    { player_status: 'ACTIVE' },
    {
      where: { session_id: sessionId, player_status: 'JOINED' },
      transaction: options.transaction,
    }
  );
}

async function update(session, changes, options = {}) {
  return session.update(changes, { transaction: options.transaction });
}

async function markSeen(player) {
  return player.update({
    last_seen_at: new Date(),
    connection_status: 'CONNECTED',
    disconnected_at: null,
  });
}

async function listPlayers(sessionId) {
  return Player.findAll({
    where: { session_id: sessionId },
    order: [['player_id', 'ASC']],
  });
}

async function findPlayerSeat(sessionId, userId, options = {}) {
  return Player.findOne({
    where: { session_id: sessionId, user_id: userId },
    transaction: options.transaction,
  });
}

async function countByQuestionSet(questionSetId, options = {}) {
  return GameSession.count({
    where: { question_set_id: questionSetId },
    transaction: options.transaction,
  });
}

async function findRunningSeatElsewhere(userId, excludedSessionId) {
  return Player.findOne({
    where: { user_id: userId },
    include: {
      model: GameSession,
      where: {
        status: 'playing',
        session_id: { [Op.ne]: excludedSessionId },
      },
    },
  });
}

async function listPlayersByScore(sessionId, limit) {
  const sql = `
    SELECT p.player_id, p.nickname, p.score, p.player_status, p.joined_at,
           COUNT(pe.penalty_id)::int AS penalty_count
      FROM players p
      LEFT JOIN penalties pe ON pe.player_id = p.player_id
     WHERE p.session_id = :sessionId
     GROUP BY p.player_id
     ORDER BY p.score DESC, COUNT(pe.penalty_id) ASC, p.joined_at ASC, p.player_id ASC
     LIMIT :limit
  `;
  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { sessionId, limit },
  });
}

async function finalizeActivePlayers(sessionId, finishedAt, options = {}) {
  return Player.update(
    { player_status: 'FINISHED', finished_at: finishedAt },
    { where: { session_id: sessionId, player_status: 'ACTIVE' }, transaction: options.transaction }
  );
}

async function findPlayersForFinalRanking(sessionId, options = {}) {
  const sql = `
    SELECT p.player_id, p.player_status, p.score, p.joined_at, p.eliminated_at, p.forfeited_at,
           COUNT(pe.penalty_id)::int AS penalty_count
      FROM players p
      LEFT JOIN penalties pe ON pe.player_id = p.player_id
     WHERE p.session_id = :sessionId
     GROUP BY p.player_id
  `;
  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { sessionId },
    transaction: options.transaction,
  });
}

async function setFinalRanks(sessionId, rankedPlayers, options = {}) {
  const t = options.transaction;
  for (const rp of rankedPlayers) {
    await Player.update(
      { final_rank: rp.final_rank },
      { where: { player_id: rp.player_id }, transaction: t }
    );
  }
  return null;
}
module.exports = {
  findByJoinCode,
  create,
  createPlayer,
  countPlayers,
  activateJoinedPlayers,
  countByQuestionSet,
  update,
  markSeen,
  listPlayers,
  findPlayerSeat,
  findRunningSeatElsewhere,
  listPlayersByScore,
  finalizeActivePlayers,
  findPlayersForFinalRanking,
  setFinalRanks,
};
