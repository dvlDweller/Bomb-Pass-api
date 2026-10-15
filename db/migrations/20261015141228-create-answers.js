'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('answers', {
      answer_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      occurrence_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      choice_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      answer_status: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      elapsed_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('answers', {
      fields: ['player_id'],
      type: 'foreign key',
      name: 'answers_player_id_fk',
      references: {
        table: 'players',
        field: 'player_id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('answers', {
      fields: ['occurrence_id'],
      type: 'foreign key',
      name: 'answers_occurrence_id_fk',
      references: {
        table: 'session_question_history',
        field: 'occurrence_id',
      },
    });

    await queryInterface.addConstraint('answers', {
      fields: ['choice_id'],
      type: 'foreign key',
      name: 'answers_choice_id_fk',
      references: {
        table: 'choices',
        field: 'choice_id',
      },
    });

    await queryInterface.addConstraint('answers', {
      fields: ['player_id', 'occurrence_id'],
      type: 'unique',
      name: 'uq_answers_player_occurrence',
    });

    await queryInterface.addConstraint('answers', {
      fields: ['answer_status'],
      type: 'check',
      name: 'ck_answers_answer_status',
      where: { answer_status: ['CORRECT', 'INCORRECT', 'TIMEOUT'] },
    });

    await queryInterface.addConstraint('answers', {
      fields: ['choice_id', 'answer_status'],
      type: 'check',
      name: 'ck_answers_choice_id_timeout',
      where: Sequelize.literal('("choice_id" IS NULL) = ("answer_status" = \'TIMEOUT\')'),
    });

    await queryInterface.addConstraint('answers', {
      fields: ['elapsed_ms'],
      type: 'check',
      name: 'ck_answers_elapsed_ms',
      where: Sequelize.literal('"elapsed_ms" >= 0'),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('answers');
  },
};
