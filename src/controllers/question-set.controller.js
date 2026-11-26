// Translates between HTTP and the service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const { envelope } = require('../utils/paginate');
const questionSetService = require('../services/question-set.service');

function toJson(questionSet, includeQuestions = false) {
  const json = {
    question_set_id: questionSet.question_set_id,
    owner_user_id: questionSet.owner_user_id,
    title: questionSet.title,
    description: questionSet.description,
    subject: questionSet.subject,
    grade_level: questionSet.grade_level,
    cover_path: questionSet.cover_path,
  };

  if (includeQuestions && Array.isArray(questionSet.questions)) {
    json.questions = questionSet.questions.map((question) => ({
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
    }));
  }

  return json;
}

async function list(req, res) {
  const { page = 1, limit = 10, sort, order, q } = matchedData(req, { locations: ['query'] });
  const result = await questionSetService.list(req.user, { page, limit, sort, order, q });
  res.status(200).json(envelope(result.rows, result.count, { page, limit }));
}

async function get(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const { include } = matchedData(req, { locations: ['query'] });
  const includeQuestions = include === 'questions';
  const questionSet = await questionSetService.get(Number(id), req.user, includeQuestions);
  res.status(200).json({ question_set: toJson(questionSet, includeQuestions) });
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

async function uploadCover(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const fs = require('fs').promises;
  try {
    const questionSet = await questionSetService.updateCover(Number(id), req.file.filename, req.user);
    res.status(200).json({ question_set: toJson(questionSet) });
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        // Ignore cleanup errors and preserve the original failure.
      }
    }
    throw error;
  }
}

module.exports = { list, get, create, update, remove, uploadCover };
