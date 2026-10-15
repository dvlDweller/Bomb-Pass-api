'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exp_transactions', {
      exp_transaction_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      reason: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'SESSION_COMPLETION',
      },
      awarded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('exp_transactions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'exp_transactions_user_id_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });

    await queryInterface.addConstraint('exp_transactions', {
      fields: ['session_id'],
      type: 'foreign key',
      name: 'exp_transactions_session_id_fk',
      references: {
        table: 'game_sessions',
        field: 'session_id',
      },
    });

    await queryInterface.addConstraint('exp_transactions', {
      fields: ['amount'],
      type: 'check',
      name: 'ck_exp_transactions_amount',
      where: Sequelize.literal('"amount" > 0'),
    });

    await queryInterface.addConstraint('exp_transactions', {
      fields: ['reason'],
      type: 'check',
      name: 'ck_exp_transactions_reason',
      where: Sequelize.literal('"reason" = \'SESSION_COMPLETION\''),
    });

    await queryInterface.addConstraint('exp_transactions', {
      fields: ['user_id', 'session_id', 'reason'],
      type: 'unique',
      name: 'uq_exp_transactions_user_session_reason',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exp_transactions');
  },
};
