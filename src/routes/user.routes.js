const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/question-set.validator');
const { roleRules } = require('../validators/auth.validator');
const userController = require('../controllers/user.controller');

const router = Router();

// All user-management endpoints require ADMIN. The guard runs before validation.
router.use(requireUser('ADMIN'));

router.get('/', userController.list);
router.patch('/:id/role', idParam, roleRules, validate, userController.changeRole);

module.exports = router;
