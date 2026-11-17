'use strict';

const password = require('../../src/security/password');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hash = await password.hash('BombPass-Demo-2026!');

    await queryInterface.bulkUpdate(
      'users',
      { password_hash: hash },
      { password_hash: null }
    );
  },

  async down(queryInterface, Sequelize) {
    // Intentionally no-op: do not remove passwords that may have been changed.
  },
};