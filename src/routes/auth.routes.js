const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const { registerRules, loginRules } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = Router();

// Registration and login are public. Only /me requires authentication.
router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.get('/me', requireUser(), authController.me);

module.exports = router;
