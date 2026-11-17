// User-management business rules.
// The service receives the authenticated actor, never req or res.
const userRepository = require('../repositories/user.repository');
const { notFound, conflict } = require('../errors/app-error');

async function list() {
  return userRepository.findAll();
}

async function changeRole(targetId, newRole, actor) {
  const target = await userRepository.findById(targetId);
  if (!target) {
    throw notFound('USER_NOT_FOUND', `User ${targetId} not found.`);
  }

  if (target.user_id === actor.user_id) {
    throw conflict('SELF_ROLE_CHANGE', 'You cannot change your own role.');
  }

  return userRepository.update(target, { role: newRole });
}

module.exports = { list, changeRole };
