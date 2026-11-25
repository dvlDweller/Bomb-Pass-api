const { Router } = require('express');
const requireUser = require('../middlewares/require-user');
const validate = require('../middlewares/validate');
const { idParam, createRules, updateRules, listRules, includeRules } = require('../validators/question-set.validator');
const { createQuestionRules, updateQuestionRules, questionIdParam } = require('../validators/question.validator');
const questionSetController = require('../controllers/question-set.controller');
const questionController = require('../controllers/question.controller');
const uploadCover = require('../middlewares/upload-cover');
const requireQuestionSetOwner = require('../middlewares/require-question-set-owner');

const router = Router();

// All question-set endpoints require HOST or ADMIN role.
router.use(requireUser('HOST', 'ADMIN'));

router.get('/', listRules, validate, questionSetController.list);
router.get('/:id', idParam, includeRules, validate, questionSetController.get);
router.post('/', createRules, validate, questionSetController.create);
router.patch('/:id', idParam, updateRules, validate, questionSetController.update);
router.delete('/:id', idParam, validate, questionSetController.remove);

// Nested question management. Ownership is enforced in the service layer.
router.get('/:id/questions', idParam, validate, questionController.list);
router.post('/:id/questions', idParam, createQuestionRules, validate, questionController.create);
router.patch('/:id/questions/:questionId', idParam, questionIdParam, updateQuestionRules, validate, questionController.update);
router.delete('/:id/questions/:questionId', idParam, questionIdParam, validate, questionController.remove);

// Cover upload. Ownership is verified before Multer writes the file.
router.put('/:id/cover', idParam, validate, requireQuestionSetOwner, uploadCover, questionSetController.uploadCover);

module.exports = router;
