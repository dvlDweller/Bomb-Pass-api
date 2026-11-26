// The only layer that queries the Question and Choice tables.
// Services call this repository, never the models or the database directly.
const { Question, Choice } = require('../models');

async function listByQuestionSet(questionSetId, options = {}) {
  const transaction = options.transaction;

  return Question.findAll({
    where: { question_set_id: questionSetId },
    include: [
      {
        model: Choice,
        as: 'choices',
      },
    ],
    order: [
      ['question_id', 'ASC'],
      [{ model: Choice, as: 'choices' }, 'choice_index', 'ASC'],
    ],
    transaction,
  });
}

async function findById(questionId, options = {}) {
  const transaction = options.transaction;

  return Question.findByPk(questionId, {
    include: [
      {
        model: Choice,
        as: 'choices',
      },
    ],
    order: [[{ model: Choice, as: 'choices' }, 'choice_index', 'ASC']],
    transaction,
  });
}

async function createQuestion(values, options = {}) {
  return Question.create(values, { transaction: options.transaction });
}

async function createChoice(values, options = {}) {
  return Choice.create(values, { transaction: options.transaction });
}

async function updateQuestion(question, changes, options = {}) {
  return question.update(changes, { transaction: options.transaction });
}

async function deleteChoices(questionId, options = {}) {
  return Choice.destroy({
    where: { question_id: questionId },
    transaction: options.transaction,
  });
}

async function deleteQuestion(question, options = {}) {
  return question.destroy({ transaction: options.transaction });
}

module.exports = {
  listByQuestionSet,
  findById,
  createQuestion,
  createChoice,
  updateQuestion,
  deleteChoices,
  deleteQuestion,
};
