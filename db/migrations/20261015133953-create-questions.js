'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('questions', {
      question_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      question_set_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'multiple_choice',
      },
      correct_index: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      time_limit_seconds: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 15,
      },
    });

    await queryInterface.addConstraint('questions', {
      fields: ['question_set_id'],
      type: 'foreign key',
      name: 'questions_question_set_id_fk',
      references: {
        table: 'question_sets',
        field: 'question_set_id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('questions', {
      fields: ['type'],
      type: 'check',
      name: 'questions_type_check',
      where: { type: ['multiple_choice', 'true_false'] },
    });

    await queryInterface.addConstraint('questions', {
      fields: ['correct_index'],
      type: 'check',
      name: 'questions_correct_index_check',
      where: Sequelize.literal('"correct_index" >= 0'),
    });

    await queryInterface.addConstraint('questions', {
      fields: ['time_limit_seconds'],
      type: 'check',
      name: 'questions_time_limit_seconds_check',
      where: Sequelize.literal('"time_limit_seconds" BETWEEN 5 AND 30'),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('questions');
  },
};
