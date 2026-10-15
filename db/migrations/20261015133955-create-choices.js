'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('choices', {
      choice_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      choice_index: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      text: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
    });

    await queryInterface.addConstraint('choices', {
      fields: ['question_id'],
      type: 'foreign key',
      name: 'choices_question_id_fk',
      references: {
        table: 'questions',
        field: 'question_id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('choices', {
      fields: ['question_id', 'choice_index'],
      type: 'unique',
      name: 'choices_question_id_choice_index_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('choices');
  },
};
