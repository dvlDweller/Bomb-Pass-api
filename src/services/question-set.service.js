// Question Set business rules and authorization.
// The service receives the authenticated user, never req or res.
const questionSetRepository = require('../repositories/question-set.repository');
const { notFound, forbidden } = require('../errors/app-error');

async function list(user) {
  if (user.role === 'ADMIN') {
    return questionSetRepository.listAll();
  }
  return questionSetRepository.listByOwner(user.user_id);
}

async function get(questionSetId, user) {
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }
  if (user.role !== 'ADMIN' && questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to access that question set.');
  }
  return questionSet;
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

module.exports = { list, get, create, update, remove };
