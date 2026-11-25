// Ensures the authenticated user owns the question set identified by :id.
// Runs before Multer writes an uploaded file.
const questionSetRepository = require('../repositories/question-set.repository');
const { notFound, forbidden } = require('../errors/app-error');

async function requireQuestionSetOwner(req, res, next) {
  const questionSet = await questionSetRepository.findById(Number(req.params.id));
  if (!questionSet) {
    throw notFound('QUESTION_SET_NOT_FOUND', `Question set ${req.params.id} not found.`);
  }
  if (req.user.role !== 'ADMIN' && questionSet.owner_user_id !== req.user.user_id) {
    throw forbidden('You are not allowed to modify this question set.');
  }
  req.questionSet = questionSet;
  next();
}

module.exports = requireQuestionSetOwner;