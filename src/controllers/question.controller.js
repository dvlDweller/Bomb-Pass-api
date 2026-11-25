// Translates between HTTP and the question service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const questionService = require('../services/question.service');

function toJson(question) {
  return {
    question_id: question.question_id,
    question_set_id: question.question_set_id,
    text: question.text,
    type: question.type,
    correct_index: question.correct_index,
    time_limit_seconds: question.time_limit_seconds,
    choices: (question.choices || []).map((choice) => ({
      choice_id: choice.choice_id,
      choice_index: choice.choice_index,
      text: choice.text,
    })),
  };
}

async function list(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const questions = await questionService.list(Number(id), req.user);
  res.status(200).json({ questions: questions.map(toJson) });
}

async function create(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const values = matchedData(req, { locations: ['body'] });
  const question = await questionService.create(Number(id), values, req.user);
  res.status(201).json({ question: toJson(question) });
}

async function update(req, res) {
  const { id, questionId } = matchedData(req, { locations: ['params'] });
  const changes = matchedData(req, { locations: ['body'] });
  const question = await questionService.update(Number(id), Number(questionId), changes, req.user);
  res.status(200).json({ question: toJson(question) });
}

async function remove(req, res) {
  const { id, questionId } = matchedData(req, { locations: ['params'] });
  await questionService.remove(Number(id), Number(questionId), req.user);
  res.status(204).end();
}

module.exports = { list, create, update, remove };
