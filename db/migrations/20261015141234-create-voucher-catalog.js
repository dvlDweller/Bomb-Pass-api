'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('voucher_catalog', {
      voucher_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      exp_cost: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      stock_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('voucher_catalog', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'voucher_catalog_created_by_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });

    await queryInterface.addConstraint('voucher_catalog', {
      fields: ['exp_cost'],
      type: 'check',
      name: 'ck_voucher_catalog_exp_cost',
      where: Sequelize.literal('"exp_cost" > 0'),
    });

    await queryInterface.addConstraint('voucher_catalog', {
      fields: ['stock_limit'],
      type: 'check',
      name: 'ck_voucher_catalog_stock_limit',
      where: Sequelize.literal('"stock_limit" >= 0'),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('voucher_catalog');
  },
};
