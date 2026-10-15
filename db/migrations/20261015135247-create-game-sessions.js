'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('game_sessions', {
      session_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      host_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      question_set_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      join_code: {
        type: Sequelize.CHAR(6),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(12),
        allowNull: false,
        defaultValue: 'waiting',
      },
      duration_limit_minutes: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 10,
      },
      bomb_time_limit_seconds: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 30,
      },
      session_end_reason: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      },
      bomb_holder_player_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      bomb_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      current_question_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      current_cycle_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      question_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      winner_player_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['host_user_id'],
      type: 'foreign key',
      name: 'game_sessions_host_user_id_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['question_set_id'],
      type: 'foreign key',
      name: 'game_sessions_question_set_id_fk',
      references: {
        table: 'question_sets',
        field: 'question_set_id',
      },
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['current_question_id'],
      type: 'foreign key',
      name: 'game_sessions_current_question_id_fk',
      references: {
        table: 'questions',
        field: 'question_id',
      },
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['join_code'],
      type: 'check',
      name: 'game_sessions_join_code_check',
      where: Sequelize.literal('"join_code" ~ \'^[1-9][0-9]{5}$\''),
    });

    await queryInterface.addIndex('game_sessions', ['join_code'], {
      unique: true,
      name: 'game_sessions_join_code_open_unique',
      where: Sequelize.literal("status IN ('waiting', 'playing')"),
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['status'],
      type: 'check',
      name: 'game_sessions_status_check',
      where: { status: ['waiting', 'playing', 'ended'] },
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['duration_limit_minutes'],
      type: 'check',
      name: 'game_sessions_duration_limit_minutes_check',
      where: Sequelize.literal('"duration_limit_minutes" BETWEEN 5 AND 15'),
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['bomb_time_limit_seconds'],
      type: 'check',
      name: 'game_sessions_bomb_time_limit_seconds_check',
      where: Sequelize.literal('"bomb_time_limit_seconds" BETWEEN 20 AND 60'),
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['session_end_reason'],
      type: 'check',
      name: 'game_sessions_session_end_reason_check',
      where: Sequelize.literal('"session_end_reason" IS NULL OR "session_end_reason" IN (\'last_player\', \'duration_limit\', \'host_ended\')'),
    });

    await queryInterface.addConstraint('game_sessions', {
      fields: ['current_cycle_number'],
      type: 'check',
      name: 'game_sessions_current_cycle_number_check',
      where: Sequelize.literal('"current_cycle_number" >= 1'),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('game_sessions');
  },
};
