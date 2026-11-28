// Validation rules for answer submission.
// Keeps request-shape rules here; business rules and database lookups live in the service layer.
const { body } = require('express-validator');

const answerRules = [
  body('question_id')
    .custom((value) => {
      if (!Number.isInteger(value) || value < 1) {
        throw new Error('question_id must be a positive integer');
      }
      return true;
    }),
  body('choice_id')
    .custom((value) => {
      if (!Number.isInteger(value) || value < 1) {
        throw new Error('choice_id must be a positive integer');
      }
      return true;
    }),
  body().custom((body) => {
    const allowedFields = ['question_id', 'choice_id'];
    const keys = Object.keys(body || {});
    if (keys.length !== allowedFields.length || !allowedFields.every((field) => keys.includes(field))) {
      throw new Error('request body must contain exactly question_id and choice_id');
    }
    return true;
  }),
];

module.exports = { answerRules };
