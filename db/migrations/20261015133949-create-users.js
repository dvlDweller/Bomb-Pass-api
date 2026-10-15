'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      school_id: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'PLAYER',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('users', {
      fields: ['school_id'],
      type: 'unique',
      name: 'users_school_id_unique',
    });

    await queryInterface.addConstraint('users', {
      fields: ['email'],
      type: 'unique',
      name: 'users_email_unique',
    });

    await queryInterface.addConstraint('users', {
      fields: ['role'],
      type: 'check',
      name: 'users_role_check',
      where: { role: ['PLAYER', 'HOST', 'ADMIN'] },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
