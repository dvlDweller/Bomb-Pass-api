// Translates between HTTP and the service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const questionSetService = require('../services/question-set.service');

function toJson(questionSet) {
  return {
    question_set_id: questionSet.question_set_id,
    owner_user_id: questionSet.owner_user_id,
    title: questionSet.title,
    description: questionSet.description,
    subject: questionSet.subject,
    grade_level: questionSet.grade_level,
  };
}

async function list(req, res) {
  const questionSets = await questionSetService.list(req.user);
  res.status(200).json({ question_sets: questionSets.map(toJson) });
}

async function get(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const questionSet = await questionSetService.get(Number(id), req.user);
  res.status(200).json({ question_set: toJson(questionSet) });
}

async function create(req, res) {
  const values = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.create(values, req.user);
  res.status(201).json({ question_set: toJson(questionSet) });
}

async function update(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const changes = matchedData(req, { locations: ['body'] });
  const questionSet = await questionSetService.update(Number(id), changes, req.user);
  res.status(200).json({ question_set: toJson(questionSet) });
}

async function remove(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  await questionSetService.remove(Number(id), req.user);
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
