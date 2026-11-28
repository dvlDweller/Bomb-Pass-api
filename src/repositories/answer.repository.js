// The only layer that queries the Answer table.
// Services call this repository, never the model or the database directly.
const { Answer } = require('../models');

async function createAnswer(values, options = {}) {
  return Answer.create(values, { transaction: options.transaction });
}

async function findByPlayerAndQuestion(playerId, questionId, options = {}) {
  return Answer.findOne({
    where: { player_id: playerId, question_id: questionId },
    transaction: options.transaction,
  });
}

async function findByPlayerAndOccurrence(playerId, occurrenceId, options = {}) {
  return Answer.findOne({
    where: { player_id: playerId, occurrence_id: occurrenceId },
    transaction: options.transaction,
  });
}

module.exports = {
  createAnswer,
  findByPlayerAndQuestion,
  findByPlayerAndOccurrence,
};
