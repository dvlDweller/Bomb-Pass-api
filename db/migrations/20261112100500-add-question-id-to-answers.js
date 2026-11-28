'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('answers', 'question_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE answers AS a
        SET question_id = sqh.question_id
        FROM session_question_history AS sqh
        WHERE a.occurrence_id = sqh.occurrence_id
      `, { transaction });

      const [missingRows] = await queryInterface.sequelize.query(`
        SELECT COUNT(*)::int AS count
        FROM answers
        WHERE question_id IS NULL
      `, { transaction });
      if (missingRows[0].count > 0) {
        throw new Error('Cannot make answers.question_id non-null: one or more answers could not be matched to a question.');
      }

      const [duplicateRows] = await queryInterface.sequelize.query(`
        SELECT player_id, question_id, COUNT(*)::int AS count
        FROM answers
        WHERE question_id IS NOT NULL
        GROUP BY player_id, question_id
        HAVING COUNT(*) > 1
      `, { transaction });
      if (duplicateRows.length > 0) {
        throw new Error(`Cannot add uq_answers_player_question: duplicate (player_id, question_id) answers exist: ${JSON.stringify(duplicateRows)}`);
      }

      await queryInterface.changeColumn('answers', 'question_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }, { transaction });

      await queryInterface.addConstraint('answers', {
        fields: ['question_id'],
        type: 'foreign key',
        name: 'answers_question_id_fk',
        references: {
          table: 'questions',
          field: 'question_id',
        },
        transaction,
      });

      await queryInterface.addConstraint('answers', {
        fields: ['player_id', 'question_id'],
        type: 'unique',
        name: 'uq_answers_player_question',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('answers', 'uq_answers_player_question', { transaction });
      await queryInterface.removeConstraint('answers', 'answers_question_id_fk', { transaction });
      await queryInterface.removeColumn('answers', 'question_id', { transaction });
    });
  },
};
