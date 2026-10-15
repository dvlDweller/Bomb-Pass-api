'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('penalties', {
      penalty_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'bomb_expiration',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('penalties', {
      fields: ['player_id'],
      type: 'foreign key',
      name: 'penalties_player_id_fk',
      references: {
        table: 'players',
        field: 'player_id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('penalties', {
      fields: ['reason'],
      type: 'check',
      name: 'ck_penalties_reason',
      where: Sequelize.literal('"reason" = \'bomb_expiration\''),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('penalties');
  },
};
