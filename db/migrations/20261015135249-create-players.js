'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('players', {
      player_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      nickname: {
        type: Sequelize.STRING(24),
        allowNull: false,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      player_status: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'JOINED',
      },
      connection_status: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'CONNECTED',
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      disconnected_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      eliminated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      forfeited_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      finished_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      final_rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addConstraint('players', {
      fields: ['session_id'],
      type: 'foreign key',
      name: 'players_session_id_fk',
      references: {
        table: 'game_sessions',
        field: 'session_id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('players', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'players_user_id_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });

    await queryInterface.addConstraint('players', {
      fields: ['session_id', 'user_id'],
      type: 'unique',
      name: 'players_session_id_user_id_unique',
    });

    await queryInterface.addConstraint('players', {
      fields: ['session_id', 'nickname'],
      type: 'unique',
      name: 'players_session_id_nickname_unique',
    });

    await queryInterface.addConstraint('players', {
      fields: ['session_id', 'final_rank'],
      type: 'unique',
      name: 'players_session_id_final_rank_unique',
    });

    await queryInterface.addConstraint('players', {
      fields: ['score'],
      type: 'check',
      name: 'players_score_check',
      where: Sequelize.literal('"score" >= 0'),
    });

    await queryInterface.addConstraint('players', {
      fields: ['player_status'],
      type: 'check',
      name: 'players_player_status_check',
      where: { player_status: ['JOINED', 'ACTIVE', 'ELIMINATED', 'FORFEITED', 'FINISHED'] },
    });

    await queryInterface.addConstraint('players', {
      fields: ['connection_status'],
      type: 'check',
      name: 'players_connection_status_check',
      where: { connection_status: ['CONNECTED', 'DISCONNECTED'] },
    });

    await queryInterface.addConstraint('players', {
      fields: ['final_rank'],
      type: 'check',
      name: 'players_final_rank_check',
      where: Sequelize.literal('"final_rank" IS NULL OR "final_rank" > 0'),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('players');
  },
};
