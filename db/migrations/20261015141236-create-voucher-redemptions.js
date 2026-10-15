'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('voucher_redemptions', {
      redemption_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      voucher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      processed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      exp_cost_snapshot: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      requested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addConstraint('voucher_redemptions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'voucher_redemptions_user_id_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });

    await queryInterface.addConstraint('voucher_redemptions', {
      fields: ['voucher_id'],
      type: 'foreign key',
      name: 'voucher_redemptions_voucher_id_fk',
      references: {
        table: 'voucher_catalog',
        field: 'voucher_id',
      },
    });

    await queryInterface.addConstraint('voucher_redemptions', {
      fields: ['processed_by'],
      type: 'foreign key',
      name: 'voucher_redemptions_processed_by_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });

    await queryInterface.addConstraint('voucher_redemptions', {
      fields: ['exp_cost_snapshot'],
      type: 'check',
      name: 'ck_voucher_redemptions_exp_cost_snapshot',
      where: Sequelize.literal('"exp_cost_snapshot" > 0'),
    });

    await queryInterface.addConstraint('voucher_redemptions', {
      fields: ['status'],
      type: 'check',
      name: 'ck_voucher_redemptions_status',
      where: {
        status: ['PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'CANCELLED'],
      },
    });

    await queryInterface.addIndex('voucher_redemptions', ['user_id'], {
      unique: true,
      name: 'uq_voucher_redemptions_one_pending_per_user',
      where: Sequelize.literal("status = 'PENDING'"),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('voucher_redemptions');
  },
};
