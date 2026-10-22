const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const { idParam, createRules, updateRules } = require('../validators/question-set.validator');
const questionSetController = require('../controllers/question-set.controller');

const router = Router();

// All question-set endpoints require HOST or ADMIN role.
router.use(requireUser('HOST', 'ADMIN'));

router.get('/', questionSetController.list);
router.get('/:id', idParam, validate, questionSetController.get);
router.post('/', createRules, validate, questionSetController.create);
router.patch('/:id', idParam, updateRules, validate, questionSetController.update);
router.delete('/:id', idParam, validate, questionSetController.remove);

module.exports = router;
