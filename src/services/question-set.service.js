// Question Set business rules and authorization.
// The service receives the authenticated user, never req or res.
const questionSetRepository = require('../repositories/question-set.repository');
const questionRepository = require('../repositories/question.repository');
const gameSessionRepository = require('../repositories/game-session.repository');
const { sequelize } = require('../models');
const { notFound, forbidden, conflict, badRequest } = require('../errors/app-error');

async function list(user, options = {}) {
  if (user.role === 'ADMIN') {
    return questionSetRepository.listAll(options);
  }
  return questionSetRepository.listByOwner(user.user_id, options);
}

async function get(questionSetId, user, includeQuestions = false) {
  // Retrieve metadata first so authorization is decided before nested content is loaded.
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }

  if (includeQuestions) {
    // Nested questions and choices are owner-only, even for ADMIN.
    if (questionSet.owner_user_id !== user.user_id) {
      throw forbidden('You are not allowed to access that question set.');
    }
  } else if (user.role !== 'ADMIN' && questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to access that question set.');
  }

  if (!includeQuestions) {
    return questionSet;
  }

  return questionSetRepository.findById(questionSetId, { includeQuestions: true });
}

async function create(values, user) {
  const { owner_user_id, ...rest } = values;
  return questionSetRepository.create({
    ...rest,
    owner_user_id: user.user_id,
  });
}

async function update(questionSetId, changes, user) {
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }
  if (user.role !== 'ADMIN' && questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to update that question set.');
  }
  return questionSetRepository.update(questionSet, changes);
}

async function remove(questionSetId, user) {
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }
  if (user.role !== 'ADMIN' && questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to remove that question set.');
  }
  return questionSetRepository.remove(questionSet);
}

async function updateCover(questionSetId, coverPath, user) {
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }
  if (user.role !== 'ADMIN' && questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to update that question set.');
  }
  return questionSetRepository.update(questionSet, { cover_path: coverPath });
}

async function assertOwnedAndMutable(questionSetId, user) {
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }
  if (questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to modify this question set.');
  }

  const sessionCount = await gameSessionRepository.countByQuestionSet(questionSetId);
  if (sessionCount > 0) {
    throw conflict('QUESTION_SET_FROZEN', 'This question set is already used by a game and cannot be changed.');
  }

  return questionSet;
}

module.exports = { list, get, create, update, remove, updateCover, assertOwnedAndMutable };
