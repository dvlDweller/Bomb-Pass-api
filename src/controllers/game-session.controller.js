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
  const data = matchedData(req, { locations: ['body'] });
  const result = await gameSessionService.joinOrRejoin(
    req.params.code,
    data.nickname,
    req.user
  );
  const status = result.created ? 201 : 200;
  res.status(status).json({ session: result.session, player: result.player });
}

async function list(req, res) {
  const players = await gameSessionService.listPlayers(req.params.code);
  res.status(200).json({ players: players });
}

module.exports = { create, get, changeStatus, join, list };
