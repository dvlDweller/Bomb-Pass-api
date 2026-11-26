// Validation rules for question and choice requests.
// Keeps request-shape rules here; business rules and database lookups live in the service layer.
const { param, body } = require('express-validator');
const { idParam } = require('./question-set.validator');

const questionIdParam = [
  param('questionId')
    .isInt({ min: 1 })
    .withMessage('questionId must be a positive integer'),
];

function validateChoices(choices, req) {
  const type = req.body.type || 'multiple_choice';
  if (!['multiple_choice', 'true_false'].includes(type)) {
    throw new Error("type must be 'multiple_choice' or 'true_false'");
  }

  const minChoices = type === 'true_false' ? 2 : 2;
  const maxChoices = type === 'true_false' ? 2 : 4;
  if (!Array.isArray(choices) || choices.length < minChoices || choices.length > maxChoices) {
    throw new Error(`choices must contain between ${minChoices} and ${maxChoices} items`);
  }
  if (!choices.every((choice) => typeof choice === 'string' && choice.trim().length > 0 && choice.length <= 120)) {
    throw new Error('each choice must be a nonempty string of at most 120 characters');
  }
  return true;
}

const createQuestionRules = [
  body('text')
    .notEmpty()
    .withMessage('text is required')
    .isString()
    .withMessage('text must be a string')
    .trim(),
  body('type')
    .optional()
    .isIn(['multiple_choice', 'true_false'])
    .withMessage("type must be 'multiple_choice' or 'true_false'"),
  body('choices')
    .isArray()
    .withMessage('choices must be an array')
    .custom((choices, { req }) => validateChoices(choices, req)),
  body('correct_index')
    .isInt({ min: 0 })
    .withMessage('correct_index must be a non-negative integer')
    .custom((value, { req }) => {
      const choices = req.body.choices;
      if (Array.isArray(choices) && value >= choices.length) {
        throw new Error('correct_index must identify one of the supplied choices');
      }
      return true;
    }),
  body('time_limit_seconds')
    .optional()
    .isInt({ min: 5, max: 30 })
    .withMessage('time_limit_seconds must be an integer between 5 and 30'),
];

const updateQuestionRules = [
  body('text')
    .optional()
    .isString()
    .withMessage('text must be a string')
    .trim()
    .notEmpty()
    .withMessage('text must not be empty'),
  body('type')
    .optional()
    .isIn(['multiple_choice', 'true_false'])
    .withMessage("type must be 'multiple_choice' or 'true_false'"),
  body('choices')
    .optional()
    .isArray()
    .withMessage('choices must be an array')
    .custom((choices, { req }) => {
      if (choices === undefined) return true;
      return validateChoices(choices, req);
    }),
  body('correct_index')
    .optional()
    .isInt({ min: 0 })
    .withMessage('correct_index must be a non-negative integer'),
  body('time_limit_seconds')
    .optional()
    .isInt({ min: 5, max: 30 })
    .withMessage('time_limit_seconds must be an integer between 5 and 30'),
  body().custom((body) => {
    const allowedFields = ['text', 'type', 'correct_index', 'time_limit_seconds', 'choices'];
    const present = allowedFields.some((field) => field in body);
    if (!present) {
      throw new Error('At least one of text, type, correct_index, time_limit_seconds, or choices is required');
    }
    return true;
  }),
];

module.exports = {
  idParam,
  questionIdParam,
  createQuestionRules,
  updateQuestionRules,
};
