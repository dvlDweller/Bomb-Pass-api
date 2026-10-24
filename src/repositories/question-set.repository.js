// The only layer that queries the QuestionSet table.
// Services call this repository, never the model or the database directly.
const { QuestionSet } = require('../models');

async function listAll() {
  return QuestionSet.findAll({ order: [['question_set_id', 'ASC']] });
}

async function listByOwner(ownerUserId) {
  return QuestionSet.findAll({
    where: { owner_user_id: ownerUserId },
    order: [['question_set_id', 'ASC']],
  });
}

async function findById(questionSetId) {
  return QuestionSet.findByPk(questionSetId);
}

async function create(values) {
  return QuestionSet.create(values);
}

async function update(questionSet, changes) {
  return questionSet.update(changes);
}

async function remove(questionSet) {
  return questionSet.destroy();
}

module.exports = {
  listAll,
  listByOwner,
  findById,
  create,
  update,
  remove,
};
