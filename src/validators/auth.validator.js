// Validation rules for authentication requests.
// Keeps request-shape rules here; business rules and database lookups live in the service layer.
const { body } = require('express-validator');

// Validates a registration request body.
// role is intentionally absent: with matchedData() a "role" in the body never reaches the service.
const registerRules = [
  body('school_id')
    .isString()
    .withMessage('school_id must be a string')
    .trim()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('school_id must match the pattern NNNN-NNNN'),
  body('full_name')
    .notEmpty()
    .withMessage('full_name is required')
    .isString()
    .withMessage('full_name must be a string')
    .trim()
    .isLength({ max: 120 })
    .withMessage('full_name must not exceed 120 characters'),
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('email must be a valid email address')
    .isLength({ max: 254 })
    .withMessage('email must not exceed 254 characters'),
  body('password')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 8, max: 72 })
    .withMessage('password must be between 8 and 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('password must contain at least one letter')
    .matches(/\d/)
    .withMessage('password must contain at least one number'),
];

// Validates a login request body.
const loginRules = [
  body('school_id')
    .exists()
    .withMessage('school_id is required')
    .isString()
    .withMessage('school_id must be text'),
  body('password')
    .exists()
    .withMessage('password is required')
    .isString()
    .withMessage('password must be text'),
];

// Reusable rules for role-management operations. Not used by registration.
const roleRules = [
  body('role')
    .isIn(['PLAYER', 'HOST', 'ADMIN'])
    .withMessage("role must be one of 'PLAYER', 'HOST', or 'ADMIN'"),
];

module.exports = {
  registerRules,
  loginRules,
  roleRules,
};
