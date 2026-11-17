// Translates between HTTP and the user service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const userService = require('../services/user.service');

function toJson(user) {
  return {
    user_id: user.user_id,
    school_id: user.school_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

async function list(req, res) {
  const users = await userService.list();
  res.status(200).json({ users: users.map(toJson) });
}

async function changeRole(req, res) {
  const { id } = matchedData(req, { locations: ['params'] });
  const { role } = matchedData(req, { locations: ['body'] });
  const updated = await userService.changeRole(Number(id), role, req.user);
  res.status(200).json({ user: toJson(updated) });
}

module.exports = { list, changeRole };
