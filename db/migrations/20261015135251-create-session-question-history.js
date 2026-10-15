'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('session_question_history', {
      occurrence_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cycle_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      displayed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('session_question_history', {
      fields: ['session_id'],
      type: 'foreign key',
      name: 'session_question_history_session_id_fk',
      references: {
        table: 'game_sessions',
        field: 'session_id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('session_question_history', {
      fields: ['question_id'],
      type: 'foreign key',
      name: 'session_question_history_question_id_fk',
      references: {
        table: 'questions',
        field: 'question_id',
      },
    });

    await queryInterface.addConstraint('session_question_history', {
      fields: ['session_id', 'cycle_number', 'question_id'],
      type: 'unique',
      name: 'session_question_history_session_cycle_question_unique',
    });

    await queryInterface.addConstraint('session_question_history', {
      fields: ['cycle_number'],
      type: 'check',
      name: 'session_question_history_cycle_number_check',
      where: Sequelize.literal('"cycle_number" >= 1'),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('session_question_history');
  },
};
