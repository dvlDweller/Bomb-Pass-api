const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const { codeParam, createRules, statusRules, joinRules } = require('../validators/game-session.validator');
const gameSessionController = require('../controllers/game-session.controller');

const router = Router();

// Create a session — host or admin only.
router.post(
  '/',
  requireUser('HOST', 'ADMIN'),
  createRules,
  validate,
  gameSessionController.create
);

// Retrieve a session — public access.
router.get(
  '/:code',
  codeParam,
  validate,
  gameSessionController.get
);

// Change session status — host or admin only.
router.patch(
  '/:code',
  requireUser('HOST', 'ADMIN'),
  codeParam,
  statusRules,
  validate,
  gameSessionController.changeStatus
);

// Join or rejoin a session — any authenticated user.
router.post(
  '/:code/players',
  requireUser(),
  codeParam,
  joinRules,
  validate,
  gameSessionController.join
);

// List session players — public access.
router.get(
  '/:code/players',
  codeParam,
  validate,
  gameSessionController.list
);

module.exports = router;
