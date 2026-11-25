// Question business rules and authorization.
// The service receives the authenticated user, never req or res.
const questionSetRepository = require('../repositories/question-set.repository');
const questionRepository = require('../repositories/question.repository');
const gameSessionRepository = require('../repositories/game-session.repository');
const { sequelize } = require('../models');
const { notFound, forbidden, conflict, badRequest } = require('../errors/app-error');

function validateQuestion(type, choices, correctIndex) {
  const effectiveType = type || 'multiple_choice';
  if (!['multiple_choice', 'true_false'].includes(effectiveType)) {
    throw badRequest('INVALID_QUESTION_TYPE', "type must be 'multiple_choice' or 'true_false'.");
  }
  if (!Array.isArray(choices)) {
    throw badRequest('INVALID_CHOICES', 'choices must be an array of strings.');
  }

  const minChoices = effectiveType === 'true_false' ? 2 : 2;
  const maxChoices = effectiveType === 'true_false' ? 2 : 4;
  if (choices.length < minChoices || choices.length > maxChoices) {
    throw badRequest('INVALID_CHOICE_COUNT', `choices must contain between ${minChoices} and ${maxChoices} items.`);
  }
  if (!choices.every((choice) => typeof choice === 'string' && choice.trim().length > 0 && choice.length <= 120)) {
    throw badRequest('INVALID_CHOICE_TEXT', 'each choice must be a nonempty string of at most 120 characters.');
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= choices.length) {
    throw badRequest('INVALID_CORRECT_INDEX', 'correct_index must identify one of the supplied choices.');
  }
}

async function getOwnedQuestionSet(questionSetId, user) {
  const questionSet = await questionSetRepository.findById(questionSetId);
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${questionSetId} not found.`);
  }
  if (questionSet.owner_user_id !== user.user_id) {
    throw forbidden('You are not allowed to modify this question set.');
  }
  return questionSet;
}

async function assertMutable(questionSetId) {
  const sessionCount = await gameSessionRepository.countByQuestionSet(questionSetId);
  if (sessionCount > 0) {
    throw conflict('QUESTION_SET_FROZEN', 'This question set is already used by a game and cannot be changed.');
  }
}

async function list(questionSetId, user) {
  const questionSet = await getOwnedQuestionSet(questionSetId, user);
  return questionRepository.listByQuestionSet(questionSet.question_set_id);
}

async function create(questionSetId, values, user) {
  const questionSet = await getOwnedQuestionSet(questionSetId, user);
  await assertMutable(questionSet.question_set_id);

  const type = values.type || 'multiple_choice';
  const choices = Array.isArray(values.choices) ? values.choices : [];
  const correctIndex = values.correct_index;
  validateQuestion(type, choices, correctIndex);

  return sequelize.transaction(async (transaction) => {
    const question = await questionRepository.createQuestion({
      question_set_id: questionSet.question_set_id,
      text: values.text,
      type,
      correct_index: correctIndex,
      time_limit_seconds: values.time_limit_seconds === undefined ? 15 : values.time_limit_seconds,
    }, { transaction });

    for (let index = 0; index < choices.length; index += 1) {
      await questionRepository.createChoice({
        question_id: question.question_id,
        choice_index: index,
        text: choices[index],
      }, { transaction });
    }

    return questionRepository.findById(question.question_id, { transaction });
  });
}

async function update(questionSetId, questionId, changes, user) {
  const questionSet = await getOwnedQuestionSet(questionSetId, user);
  await assertMutable(questionSet.question_set_id);

  const question = await questionRepository.findById(questionId);
  if (!question || question.question_set_id !== Number(questionSetId)) {
    throw notFound('QUESTION_NOT_FOUND', `Question ${questionId} not found.`);
  }

  const type = changes.type === undefined ? question.type : changes.type;
  const choicesSupplied = Object.prototype.hasOwnProperty.call(changes, 'choices');
  const effectiveChoices = choicesSupplied
    ? changes.choices
    : (question.choices || []).map((choice) => choice.text);
  const effectiveCorrectIndex = changes.correct_index === undefined ? question.correct_index : changes.correct_index;

  validateQuestion(type, effectiveChoices, effectiveCorrectIndex);

  return sequelize.transaction(async (transaction) => {
    await questionRepository.updateQuestion(question, {
      text: changes.text === undefined ? question.text : changes.text,
      type,
      correct_index: effectiveCorrectIndex,
      time_limit_seconds: changes.time_limit_seconds === undefined ? question.time_limit_seconds : changes.time_limit_seconds,
    }, { transaction });

    if (choicesSupplied) {
      await questionRepository.deleteChoices(question.question_id, { transaction });
      for (let index = 0; index < effectiveChoices.length; index += 1) {
        await questionRepository.createChoice({
          question_id: question.question_id,
          choice_index: index,
          text: effectiveChoices[index],
        }, { transaction });
      }
    }

    return questionRepository.findById(question.question_id, { transaction });
  });
}

async function remove(questionSetId, questionId, user) {
  const questionSet = await getOwnedQuestionSet(questionSetId, user);
  await assertMutable(questionSet.question_set_id);

  const question = await questionRepository.findById(questionId);
  if (!question || question.question_set_id !== Number(questionSetId)) {
    throw notFound('QUESTION_NOT_FOUND', `Question ${questionId} not found.`);
  }

  await sequelize.transaction(async (transaction) => {
    await questionRepository.deleteQuestion(question, { transaction });
  });
}

module.exports = { list, create, update, remove };
