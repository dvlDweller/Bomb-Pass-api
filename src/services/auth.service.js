// Authentication business rules.
// The service receives validated data and the authenticated account, never req or res.
const userRepository = require('../repositories/user.repository');
const password = require('../security/password');
const token = require('../security/token');
const env = require('../config/env');
const { unauthorized } = require('../errors/app-error');

async function register(values) {
  const passwordHash = await password.hash(values.password);

  const created = await userRepository.create({
    school_id: values.school_id,
    full_name: values.full_name,
    email: values.email,
    role: 'PLAYER',
    password_hash: passwordHash,
  });

  // Reload through the default scope so the password hash is never returned.
  return userRepository.findById(created.user_id);
}

async function login(credentials) {
  const account = await userRepository.findForLogin(credentials.school_id);

  // Always compare, even when the account does not exist. The kit's dummy hash
  // keeps the timing of both failure paths close together.
  const ok = await password.matches(credentials.password, account ? account.password_hash : null);
  if (!ok) {
    throw unauthorized('Invalid school ID or password.', 'INVALID_CREDENTIALS');
  }

  const issuedToken = token.issue(account);
  const safeAccount = await userRepository.findById(account.user_id);

  return {
    token: issuedToken,
    token_type: 'Bearer',
    expires_in: env.jwt.expiresIn,
    user: safeAccount,
  };
}

async function me(account) {
  const current = await userRepository.findById(account.user_id);
  if (!current) {
    throw unauthorized('This account no longer exists.', 'INVALID_TOKEN');
  }
  return current;
}

module.exports = { register, login, me };
