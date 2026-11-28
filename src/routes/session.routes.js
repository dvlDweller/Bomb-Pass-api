const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const { codeParam, createRules, statusRules, joinRules } = require('../validators/game-session.validator');
const { limitRules } = require('../validators/leaderboard.validator');
const { answerRules } = require('../validators/answer.validator');
const gameSessionController = require('../controllers/game-session.controller');
const answerController = require('../controllers/answer.controller');

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

// Retrieve the current question — public access, without answer correctness.
router.get(
  '/:code/question',
  codeParam,
  validate,
  gameSessionController.getCurrentQuestion
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

// Submit an answer — any authenticated, seated player.
router.post(
  '/:code/answers',
  requireUser(),
  codeParam,
  answerRules,
  validate,
  answerController.submit
);

// Retrieve the leaderboard � public access.
router.get(
  '/:code/leaderboard',
  codeParam,
  limitRules,
  validate,
  gameSessionController.leaderboard
);
module.exports = router;
