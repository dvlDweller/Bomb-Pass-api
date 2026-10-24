// Translates between HTTP and the service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const questionSetService = require('../services/question-set.service');

async function list(req, res) {
  const questionSets = await questionSetService.list(req.user);
  res.status(200).json({ question_sets: questionSets });
}

async function get(req, res) {
  const questionSet = await questionSetService.get(Number(req.params.id), req.user);
  res.status(200).json({ question_set: questionSet });
}

async function create(req, res) {
  const questionSet = await questionSetService.create(req.body, req.user);
  res.status(201).json({ question_set: questionSet });
}

async function update(req, res) {
  const changes = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.update(Number(req.params.id), changes, req.user);
  res.status(200).json({ question_set: questionSet });
}

async function remove(req, res) {
  await questionSetService.remove(Number(req.params.id), req.user);
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
