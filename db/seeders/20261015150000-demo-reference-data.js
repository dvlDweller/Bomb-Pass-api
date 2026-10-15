'use strict';

const { QueryTypes } = require('sequelize');

async function selectRows(db, sql, replacements = {}, transaction) {
  return db.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
    ...(transaction ? { transaction } : {}),
  });
}

async function firstRow(db, sql, replacements = {}, transaction) {
  const rows = await selectRows(db, sql, replacements, transaction);
  return rows[0] || null;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const db = queryInterface.sequelize;
    const tx = await db.transaction();

    try {
      const userSpecs = [
        { school_id: '2099-0001', full_name: 'Host Account', email: 'host0001@bombpass.test', role: 'HOST' },
        { school_id: '2099-1001', full_name: 'Alice Player', email: 'player0001@bombpass.test', role: 'PLAYER' },
        { school_id: '2099-1002', full_name: 'Bob Player', email: 'player0002@bombpass.test', role: 'PLAYER' },
        { school_id: '2099-1003', full_name: 'Charlie Player', email: 'player0003@bombpass.test', role: 'PLAYER' },
        { school_id: '2099-1004', full_name: 'Diana Player', email: 'player0004@bombpass.test', role: 'PLAYER' },
        { school_id: '2099-1005', full_name: 'Eric Player', email: 'player0005@bombpass.test', role: 'PLAYER' },
        { school_id: '2099-9001', full_name: 'Admin Account', email: 'admin9001@bombpass.test', role: 'ADMIN' },
      ];
      const userIds = {};

      for (const spec of userSpecs) {
        const existing = await firstRow(
          db,
          'SELECT user_id FROM users WHERE email = :email',
          { email: spec.email },
          tx
        );

        if (existing) {
          await queryInterface.bulkUpdate('users', {
            school_id: spec.school_id,
            full_name: spec.full_name,
            role: spec.role,
          }, { email: spec.email }, { transaction: tx });
        } else {
          await queryInterface.bulkInsert('users', [spec], { transaction: tx });
        }

        const row = await firstRow(
          db,
          'SELECT user_id FROM users WHERE email = :email',
          { email: spec.email },
          tx
        );
        if (!row) throw new Error(`Reference seeder could not resolve fixture user ${spec.email}.`);
        userIds[spec.email] = row.user_id;
      }

      const questionSetValues = {
        owner_user_id: userIds['host0001@bombpass.test'],
        title: 'Bomb Pass Sample Set',
        description: 'Fictitious sample question set',
        subject: 'General Knowledge',
        grade_level: '10',
      };
      let questionSet = await firstRow(
        db,
        'SELECT question_set_id FROM question_sets WHERE owner_user_id = :owner_user_id AND title = :title',
        { owner_user_id: questionSetValues.owner_user_id, title: questionSetValues.title },
        tx
      );

      if (!questionSet) {
        await queryInterface.bulkInsert('question_sets', [questionSetValues], { transaction: tx });
      }
      questionSet = await firstRow(
        db,
        'SELECT question_set_id FROM question_sets WHERE owner_user_id = :owner_user_id AND title = :title',
        { owner_user_id: questionSetValues.owner_user_id, title: questionSetValues.title },
        tx
      );
      if (!questionSet) throw new Error('Reference seeder could not resolve the sample question set.');

      await queryInterface.bulkUpdate('question_sets', {
        description: questionSetValues.description,
        subject: questionSetValues.subject,
        grade_level: questionSetValues.grade_level,
      }, { question_set_id: questionSet.question_set_id }, { transaction: tx });

      const questionSpecs = [
        {
          question_set_id: questionSet.question_set_id,
          text: 'What color is the sky on a clear day?',
          type: 'multiple_choice',
          correct_index: 1,
          time_limit_seconds: 10,
        },
        {
          question_set_id: questionSet.question_set_id,
          text: 'Which number comes after 7?',
          type: 'multiple_choice',
          correct_index: 2,
          time_limit_seconds: 10,
        },
      ];
      const questionIds = {};

      for (const spec of questionSpecs) {
        let row = await firstRow(
          db,
          'SELECT question_id FROM questions WHERE question_set_id = :question_set_id AND text = :text',
          { question_set_id: spec.question_set_id, text: spec.text },
          tx
        );
        if (!row) {
          await queryInterface.bulkInsert('questions', [spec], { transaction: tx });
          row = await firstRow(
            db,
            'SELECT question_id FROM questions WHERE question_set_id = :question_set_id AND text = :text',
            { question_set_id: spec.question_set_id, text: spec.text },
            tx
          );
        } else {
          await queryInterface.bulkUpdate('questions', {
            type: spec.type,
            correct_index: spec.correct_index,
            time_limit_seconds: spec.time_limit_seconds,
          }, { question_id: row.question_id }, { transaction: tx });
        }
        if (!row) throw new Error(`Reference seeder could not resolve fixture question: ${spec.text}`);
        questionIds[spec.text] = row.question_id;
      }

      const fixtureChoices = [
        { question_id: questionIds['What color is the sky on a clear day?'], choice_index: 0, text: 'Green' },
        { question_id: questionIds['What color is the sky on a clear day?'], choice_index: 1, text: 'Blue' },
        { question_id: questionIds['What color is the sky on a clear day?'], choice_index: 2, text: 'Red' },
        { question_id: questionIds['What color is the sky on a clear day?'], choice_index: 3, text: 'Yellow' },
        { question_id: questionIds['Which number comes after 7?'], choice_index: 0, text: '6' },
        { question_id: questionIds['Which number comes after 7?'], choice_index: 1, text: '9' },
        { question_id: questionIds['Which number comes after 7?'], choice_index: 2, text: '8' },
        { question_id: questionIds['Which number comes after 7?'], choice_index: 3, text: '10' },
      ];

      for (const choice of fixtureChoices) {
        const existing = await firstRow(
          db,
          'SELECT choice_id FROM choices WHERE question_id = :question_id AND choice_index = :choice_index',
          { question_id: choice.question_id, choice_index: choice.choice_index },
          tx
        );
        if (!existing) {
          await queryInterface.bulkInsert('choices', [choice], { transaction: tx });
        }
        await queryInterface.bulkUpdate('choices', { text: choice.text }, {
          question_id: choice.question_id,
          choice_index: choice.choice_index,
        }, { transaction: tx });
      }

      const voucherSpecs = [
        {
          created_by: userIds['admin9001@bombpass.test'],
          name: 'Inactive Bookmark Voucher',
          description: 'Sample inactive voucher',
          exp_cost: 150,
          stock_limit: 5,
          is_active: false,
        },
        {
          created_by: userIds['admin9001@bombpass.test'],
          name: 'Approved Reading Voucher',
          description: 'Sample approved voucher',
          exp_cost: 100,
          stock_limit: 10,
          is_active: true,
        },
      ];
      const voucherIds = {};

      for (const spec of voucherSpecs) {
        let row = await firstRow(
          db,
          'SELECT voucher_id FROM voucher_catalog WHERE created_by = :created_by AND name = :name',
          { created_by: spec.created_by, name: spec.name },
          tx
        );
        if (!row) {
          await queryInterface.bulkInsert('voucher_catalog', [{ ...spec, created_at: new Date() }], { transaction: tx });
          row = await firstRow(
            db,
            'SELECT voucher_id FROM voucher_catalog WHERE created_by = :created_by AND name = :name',
            { created_by: spec.created_by, name: spec.name },
            tx
          );
        } else {
          await queryInterface.bulkUpdate('voucher_catalog', {
            description: spec.description,
            exp_cost: spec.exp_cost,
            stock_limit: spec.stock_limit,
            is_active: spec.is_active,
          }, { voucher_id: row.voucher_id }, { transaction: tx });
        }
        if (!row) throw new Error(`Reference seeder could not resolve voucher ${spec.name}.`);
        voucherIds[spec.name] = row.voucher_id;
      }

      const fixtureUserId = userIds['player0001@bombpass.test'];
      const existingPending = await firstRow(
        db,
        `SELECT redemption_id, voucher_id, status
         FROM voucher_redemptions
         WHERE user_id = :user_id AND status = 'PENDING'
         LIMIT 1`,
        { user_id: fixtureUserId },
        tx
      );

      if (existingPending) {
        if (String(existingPending.voucher_id) !== String(voucherIds['Approved Reading Voucher'])) {
          throw new Error(
            'Fixture conflict: player0001 already has a pending redemption for a different voucher; no unrelated redemption was changed.'
          );
        }
      } else {
        await queryInterface.bulkInsert('voucher_redemptions', [{
          user_id: fixtureUserId,
          voucher_id: voucherIds['Approved Reading Voucher'],
          processed_by: null,
          exp_cost_snapshot: 100,
          status: 'PENDING',
          requested_at: new Date('2026-09-30T08:30:00.000Z'),
          processed_at: null,
        }], { transaction: tx });

        const inserted = await firstRow(
          db,
          `SELECT redemption_id FROM voucher_redemptions
           WHERE user_id = :user_id AND voucher_id = :voucher_id AND status = 'PENDING'`,
          { user_id: fixtureUserId, voucher_id: voucherIds['Approved Reading Voucher'] },
          tx
        );
        if (!inserted) throw new Error('Reference seeder failed to create the pending fixture redemption.');
      }

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const db = queryInterface.sequelize;
    const tx = await db.transaction();
    try {
      await db.query(
        `DELETE FROM voucher_redemptions
         WHERE user_id = (SELECT user_id FROM users WHERE email = 'player0001@bombpass.test')
           AND voucher_id = (SELECT voucher_id FROM voucher_catalog
                             WHERE created_by = (SELECT user_id FROM users WHERE email = 'admin9001@bombpass.test')
                               AND name = 'Approved Reading Voucher')
           AND status = 'PENDING'`,
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM voucher_catalog
         WHERE created_by = (SELECT user_id FROM users WHERE email = 'admin9001@bombpass.test')
           AND name IN ('Inactive Bookmark Voucher', 'Approved Reading Voucher')`,
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM choices
         WHERE question_id IN (
           SELECT q.question_id
           FROM questions q
           JOIN question_sets qs ON q.question_set_id = qs.question_set_id
           JOIN users u ON qs.owner_user_id = u.user_id
           WHERE u.email = 'host0001@bombpass.test'
             AND qs.title = 'Bomb Pass Sample Set'
         )`,
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM questions
         WHERE question_set_id = (
           SELECT question_set_id FROM question_sets
           WHERE title = 'Bomb Pass Sample Set'
             AND owner_user_id = (SELECT user_id FROM users WHERE email = 'host0001@bombpass.test')
         )`,
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM question_sets
         WHERE title = 'Bomb Pass Sample Set'
           AND owner_user_id = (SELECT user_id FROM users WHERE email = 'host0001@bombpass.test')`,
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM users WHERE email IN (
          'host0001@bombpass.test',
          'player0001@bombpass.test',
          'player0002@bombpass.test',
          'player0003@bombpass.test',
          'player0004@bombpass.test',
          'player0005@bombpass.test',
          'admin9001@bombpass.test'
        )`,
        { transaction: tx }
      );
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  },
};
