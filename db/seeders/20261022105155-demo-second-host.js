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
        { school_id: '2099-0003', full_name: 'Second Host', email: 'host0003@bombpass.test', role: 'HOST' },
        { school_id: '2099-1006', full_name: 'Free Test Player', email: 'player0006@bombpass.test', role: 'PLAYER' },
      ];

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
        if (!row) throw new Error(`Second-host seeder could not resolve fixture user ${spec.email}.`);
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
        'DELETE FROM users WHERE email IN (:host_email, :player_email)',
        {
          replacements: {
            host_email: 'host0003@bombpass.test',
            player_email: 'player0006@bombpass.test',
          },
          transaction: tx,
        }
      );
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  },
};
