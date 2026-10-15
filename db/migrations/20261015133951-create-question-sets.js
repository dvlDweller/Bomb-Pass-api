'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('question_sets', {
      question_set_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      owner_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      subject: {
        type: Sequelize.STRING(80),
        allowNull: true,
        defaultValue: null,
      },
      grade_level: {
        type: Sequelize.STRING(40),
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.addConstraint('question_sets', {
      fields: ['owner_user_id'],
      type: 'foreign key',
      name: 'question_sets_owner_user_id_fk',
      references: {
        table: 'users',
        field: 'user_id',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('question_sets');
  },
};
