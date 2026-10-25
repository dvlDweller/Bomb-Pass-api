// Translates between HTTP and the service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const gameSessionService = require('../services/game-session.service');

async function create(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const session = await gameSessionService.create(req.user, data);
  res.status(201).json({ session: session });
}

async function get(req, res) {
  const session = await gameSessionService.get(req.params.code);
  res.status(200).json({ session: session });
}

async function changeStatus(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const session = await gameSessionService.changeStatus(
    req.params.code,
    data.status,
    req.user
  );
  res.status(200).json({ session: session });
}

async function join(req, res) {
  const { code } = matchedData(req, { locations: ['params'] });
  const data = matchedData(req, { locations: ['body'] });
  const result = await gameSessionService.joinOrRejoin(
    code,
    data.nickname,
    req.user
  );
  const status = result.created ? 201 : 200;
  res.status(status).json({
    player_id: result.player.player_id,
    nickname: result.player.nickname,
    score: result.player.score,
    rejoined: !result.created,
    session: {
      code: result.session.join_code,
      status: result.session.status,
      current_cycle_number: result.session.current_cycle_number,
      current_question_id: result.session.current_question_id,
    },
  });
}

async function list(req, res) {
  const players = await gameSessionService.listPlayers(req.params.code);
  const exposed = players.map((player) => ({
    nickname: player.nickname,
    score: player.score,
  }));
  res.status(200).json({ players: exposed });
}

module.exports = { create, get, changeStatus, join, list };
