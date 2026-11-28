// The only layer that queries the SessionQuestionHistory table.
// Services call this repository, never the model or the database directly.
const { SessionQuestionHistory } = require('../models');

async function findOccurrence(sessionId, cycleNumber, questionId, options = {}) {
  return SessionQuestionHistory.findOne({
    where: {
      session_id: sessionId,
      cycle_number: cycleNumber,
      question_id: questionId,
    },
    transaction: options.transaction,
  });
}

async function createOccurrence(values, options = {}) {
  return SessionQuestionHistory.create(values, { transaction: options.transaction });
}

module.exports = {
  findOccurrence,
  createOccurrence,
};
