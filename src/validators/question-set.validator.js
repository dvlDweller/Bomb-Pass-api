// Validation rules for question-set requests.
// Keeps request-shape rules here; business rules and DB lookups live in the service layer.
const { param, body } = require('express-validator');

// Validates the question set ID URL parameter (:id).
const idParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('id must be a positive integer'),
];

// Validates a create question-set request body.
// owner_user_id is intentionally absent: the service derives it from the authenticated user.
const createRules = [
  body('title')
    .notEmpty()
    .withMessage('title is required')
    .isString()
    .withMessage('title must be a string')
    .isLength({ max: 120 })
    .withMessage('title must not exceed 120 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  body('subject')
    .optional()
    .isString()
    .withMessage('subject must be a string')
    .isLength({ max: 80 })
    .withMessage('subject must not exceed 80 characters'),
  body('grade_level')
    .optional()
    .isString()
    .withMessage('grade_level must be a string')
    .isLength({ max: 40 })
    .withMessage('grade_level must not exceed 40 characters'),
];

// Validates an update question-set request body.
// All fields are optional for partial updates; owner_user_id is not accepted.
const updateRules = [
  body('title')
    .optional()
    .isString()
    .withMessage('title must be a string')
    .isLength({ max: 120 })
    .withMessage('title must not exceed 120 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  body('subject')
    .optional()
    .isString()
    .withMessage('subject must be a string')
    .isLength({ max: 80 })
    .withMessage('subject must not exceed 80 characters'),
  body('grade_level')
    .optional()
    .isString()
    .withMessage('grade_level must be a string')
    .isLength({ max: 40 })
    .withMessage('grade_level must not exceed 40 characters'),
  body().custom((body) => {
    const allowedFields = ['title', 'description', 'subject', 'grade_level'];
    const present = allowedFields.some((field) => field in body);
    if (!present) {
      throw new Error('At least one of title, description, subject, or grade_level is required');
    }
    return true;
  }),
];

module.exports = {
  idParam,
  createRules,
  updateRules,
};
