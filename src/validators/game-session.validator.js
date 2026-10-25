// Validation rules for game-session requests.
// Keeps request-shape rules here; business rules and DB lookups live in the service layer.
const { param, body } = require('express-validator');

// Validates the session join code URL parameter (:code).
const codeParam = [
  param('code')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('code must be a six-digit number with no leading zero'),
];

// Validates a create session request body.
// host_user_id, session_id, join_code, and status are intentionally absent:
// the service derives them from the authenticated user and settings.
const createRules = [
  body('question_set_id')
    .isInt({ min: 1 })
    .withMessage('question_set_id must be a positive integer'),
  body('duration_limit_minutes')
    .optional()
    .isInt({ min: 5, max: 15 })
    .withMessage('duration_limit_minutes must be an integer between 5 and 15'),
  body('bomb_time_limit_seconds')
    .optional()
    .isInt({ min: 20, max: 60 })
    .withMessage('bomb_time_limit_seconds must be an integer between 20 and 60'),
];

// Validates a change status request body.
const statusRules = [
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(['playing', 'ended'])
    .withMessage("status must be one of 'playing' or 'ended'"),
];

// Validates a join/rejoin request body.
const joinRules = [
  body('nickname')
    .notEmpty()
    .withMessage('nickname is required')
    .isString()
    .withMessage('nickname must be a string')
    .trim()
    .isLength({ min: 2, max: 24 })
    .withMessage('nickname must be between 2 and 24 characters'),
];

module.exports = {
  codeParam,
  createRules,
  statusRules,
  joinRules,
};
