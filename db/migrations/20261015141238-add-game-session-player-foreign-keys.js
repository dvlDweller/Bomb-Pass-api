'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('game_sessions', {
      fields: ['bomb_holder_player_id'],
      type: 'foreign key',
      name: 'game_sessions_bomb_holder_player_id_fk',
      references: {
        table: 'players',
        field: 'player_id',
      },
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['winner_player_id'],
      type: 'foreign key',
      name: 'game_sessions_winner_player_id_fk',
      references: {
        table: 'players',
        field: 'player_id',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'game_sessions',
      'game_sessions_winner_player_id_fk'
    );

    await queryInterface.removeConstraint(
      'game_sessions',
      'game_sessions_bomb_holder_player_id_fk'
    );
  },
};
