// The only layer that queries the GameSession and Player tables.
// Services call this repository, never the model or the database directly.
const { GameSession, Player } = require('../models');
const { Op } = require('sequelize');

async function findByJoinCode(code) {
  return GameSession.findOne({
    where: { join_code: code },
    order: [['session_id', 'DESC']],
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

async function update(session, changes) {
  return session.update(changes);
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

async function findPlayerSeat(sessionId, userId) {
  return Player.findOne({
    where: { session_id: sessionId, user_id: userId },
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

module.exports = {
  findByJoinCode,
  create,
  createPlayer,
  countPlayers,
  update,
  markSeen,
  listPlayers,
  findPlayerSeat,
  findRunningSeatElsewhere,
};
