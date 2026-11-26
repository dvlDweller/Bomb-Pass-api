// The only layer that queries the QuestionSet table.
// Services call this repository, never the model or the database directly.
const { QuestionSet, Question, Choice } = require('../models');
const { Op } = require('sequelize');
const { toOffset } = require('../utils/paginate');

function buildWhere(ownerUserId, options) {
  const where = {};

  if (ownerUserId !== undefined && ownerUserId !== null) {
    where.owner_user_id = ownerUserId;
  }

  const q = options && options.q;
  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
      { subject: { [Op.iLike]: `%${q}%` } },
      { grade_level: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return where;
}

function buildListOptions(ownerUserId, options = {}) {
  const where = buildWhere(ownerUserId, options);
  const { limit, offset } = toOffset({ page: options.page, limit: options.limit });
  const sort = options.sort || 'question_set_id';
  const order = String(options.order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  return {
    where,
    order: [[sort, order]],
    limit,
    offset,
  };
}

async function listAll(options = {}) {
  return QuestionSet.findAndCountAll(buildListOptions(undefined, options));
}

async function listByOwner(ownerUserId, options = {}) {
  if (ownerUserId === undefined || ownerUserId === null) {
    throw new TypeError('ownerUserId is required to list question sets by owner');
  }

  return QuestionSet.findAndCountAll(buildListOptions(ownerUserId, options));
}

async function findById(questionSetId, options = {}) {
  if (!options.includeQuestions) {
    return QuestionSet.findByPk(questionSetId);
  }

  return QuestionSet.findByPk(questionSetId, {
    include: [
      {
        model: Question,
        as: 'questions',
        include: [
          {
            model: Choice,
            as: 'choices',
          },
        ],
      },
    ],
    order: [
      [{ model: Question, as: 'questions' }, 'question_id', 'ASC'],
      [{ model: Question, as: 'questions' }, { model: Choice, as: 'choices' }, 'choice_index', 'ASC'],
    ],
  });
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
