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

async function requireRow(db, sql, replacements, transaction, description) {
  const row = await firstRow(db, sql, replacements, transaction);
  if (!row) throw new Error(`Finished-game seeder could not find ${description}.`);
  return row;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const db = queryInterface.sequelize;
    const tx = await db.transaction();

    try {
      const host = await requireRow(
        db,
        'SELECT user_id FROM users WHERE email = :email',
        { email: 'host0001@bombpass.test' },
        tx,
        'the host fixture user'
      );

      const playerEmails = [
        'player0001@bombpass.test',
        'player0002@bombpass.test',
        'player0003@bombpass.test',
        'player0004@bombpass.test',
        'player0005@bombpass.test',
      ];
      const userIds = {};
      for (const email of playerEmails) {
        const user = await requireRow(
          db,
          'SELECT user_id FROM users WHERE email = :email',
          { email },
          tx,
          `fixture user ${email}`
        );
        userIds[email] = user.user_id;
      }

      const questionSet = await requireRow(
        db,
        'SELECT question_set_id FROM question_sets WHERE title = :title AND owner_user_id = :owner_user_id',
        { title: 'Bomb Pass Sample Set', owner_user_id: host.user_id },
        tx,
        'the Bomb Pass Sample Set question set'
      );

      const questions = await selectRows(
        db,
        'SELECT question_id, text FROM questions WHERE question_set_id = :question_set_id',
        { question_set_id: questionSet.question_set_id },
        tx
      );
      const question1 = questions.find((row) => row.text === 'What color is the sky on a clear day?');
      const question2 = questions.find((row) => row.text === 'Which number comes after 7?');
      if (!question1 || !question2) {
        throw new Error('Finished-game seeder requires both exact fixture questions.');
      }

      const choiceRows = await selectRows(
        db,
        `SELECT choice_id, question_id, choice_index
         FROM choices
         WHERE question_id IN (:question1_id, :question2_id)`,
        { question1_id: question1.question_id, question2_id: question2.question_id },
        tx
      );
      const choiceByKey = {};
      for (const row of choiceRows) {
        choiceByKey[`${row.question_id}:${row.choice_index}`] = row.choice_id;
      }
      for (const question of [question1, question2]) {
        for (let index = 0; index < 4; index += 1) {
          if (!choiceByKey[`${question.question_id}:${index}`]) {
            throw new Error(`Missing choice index ${index} for fixture question "${question.text}".`);
          }
        }
      }

      // Keep the dedicated ended-session fixture deterministic on reruns.
      const endedSessionValues = {
        host_user_id: host.user_id,
        question_set_id: questionSet.question_set_id,
        join_code: '202501',
        status: 'ended',
        created_at: new Date('2026-09-30T08:00:00.000Z'),
        started_at: new Date('2026-09-30T08:05:00.000Z'),
        ended_at: new Date('2026-09-30T08:18:00.000Z'),
        duration_limit_minutes: 13,
        bomb_time_limit_seconds: 30,
        session_end_reason: 'duration_limit',
        bomb_holder_player_id: null,
        bomb_expires_at: null,
        current_question_id: question2.question_id,
        current_cycle_number: 1,
        question_expires_at: null,
        winner_player_id: null,
      };
      let endedSession = await firstRow(
        db,
        'SELECT session_id FROM game_sessions WHERE join_code = :join_code',
        { join_code: '202501' },
        tx
      );
      if (!endedSession) {
        await queryInterface.bulkInsert('game_sessions', [endedSessionValues], { transaction: tx });
        endedSession = await firstRow(
          db,
          'SELECT session_id FROM game_sessions WHERE join_code = :join_code',
          { join_code: '202501' },
          tx
        );
      }
      if (!endedSession) throw new Error('Failed to resolve ended fixture session 202501 after insert.');
      const endedSessionId = endedSession.session_id;
      await queryInterface.bulkUpdate(
        'game_sessions',
        { ...endedSessionValues, winner_player_id: null, bomb_holder_player_id: null },
        { session_id: endedSessionId },
        { transaction: tx }
      );

      const endedPlayerSpecs = [
        {
          user_id: userIds['player0001@bombpass.test'], session_id: endedSessionId, nickname: 'Alice', score: 20,
          player_status: 'FINISHED', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:04:00.000Z'), last_seen_at: new Date('2026-09-30T08:18:00.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null,
          finished_at: new Date('2026-09-30T08:18:00.000Z'), final_rank: 1,
        },
        {
          user_id: userIds['player0002@bombpass.test'], session_id: endedSessionId, nickname: 'Bob', score: 10,
          player_status: 'FINISHED', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:04:30.000Z'), last_seen_at: new Date('2026-09-30T08:18:00.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null,
          finished_at: new Date('2026-09-30T08:18:00.000Z'), final_rank: 2,
        },
        {
          user_id: userIds['player0003@bombpass.test'], session_id: endedSessionId, nickname: 'Charlie', score: 10,
          player_status: 'FINISHED', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:05:00.000Z'), last_seen_at: new Date('2026-09-30T08:18:00.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null,
          finished_at: new Date('2026-09-30T08:18:00.000Z'), final_rank: 3,
        },
        {
          user_id: userIds['player0005@bombpass.test'], session_id: endedSessionId, nickname: 'Eric', score: 0,
          player_status: 'ELIMINATED', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:06:00.000Z'), last_seen_at: new Date('2026-09-30T08:15:00.000Z'),
          disconnected_at: null, eliminated_at: new Date('2026-09-30T08:15:00.000Z'), forfeited_at: null,
          finished_at: null, final_rank: 4,
        },
        {
          user_id: userIds['player0004@bombpass.test'], session_id: endedSessionId, nickname: 'Diana', score: 0,
          player_status: 'FORFEITED', connection_status: 'DISCONNECTED',
          joined_at: new Date('2026-09-30T08:05:30.000Z'), last_seen_at: new Date('2026-09-30T08:12:00.000Z'),
          disconnected_at: new Date('2026-09-30T08:12:00.000Z'), eliminated_at: null,
          forfeited_at: new Date('2026-09-30T08:13:00.000Z'), finished_at: null, final_rank: 5,
        },
      ];

      // Clear fixture ranks first to avoid transient conflicts when correcting old ranks on reruns.
      await db.query(
        `UPDATE players SET final_rank = NULL
         WHERE session_id = :session_id AND user_id IN (:alice_id, :bob_id, :charlie_id, :diana_id, :eric_id)`,
        {
          replacements: {
            session_id: endedSessionId,
            alice_id: userIds['player0001@bombpass.test'],
            bob_id: userIds['player0002@bombpass.test'],
            charlie_id: userIds['player0003@bombpass.test'],
            diana_id: userIds['player0004@bombpass.test'],
            eric_id: userIds['player0005@bombpass.test'],
          },
          transaction: tx,
        }
      );

      for (const spec of endedPlayerSpecs) {
        const existing = await firstRow(
          db,
          'SELECT player_id FROM players WHERE session_id = :session_id AND user_id = :user_id',
          { session_id: endedSessionId, user_id: spec.user_id },
          tx
        );
        const values = { ...spec };
        delete values.session_id;
        delete values.user_id;
        if (existing) {
          await queryInterface.bulkUpdate(
            'players', values,
            { player_id: existing.player_id, session_id: endedSessionId, user_id: spec.user_id },
            { transaction: tx }
          );
        } else {
          await queryInterface.bulkInsert('players', [spec], { transaction: tx });
        }
      }

      const endedPlayers = await selectRows(
        db,
        `SELECT p.player_id, u.email
         FROM players p JOIN users u ON u.user_id = p.user_id
         WHERE p.session_id = :session_id AND u.email IN (:alice, :bob, :charlie, :diana, :eric)`,
        {
          session_id: endedSessionId,
          alice: 'player0001@bombpass.test',
          bob: 'player0002@bombpass.test',
          charlie: 'player0003@bombpass.test',
          diana: 'player0004@bombpass.test',
          eric: 'player0005@bombpass.test',
        },
        tx
      );
      const endedPlayerIds = Object.fromEntries(endedPlayers.map((row) => [row.email, row.player_id]));
      for (const email of playerEmails) {
        if (!endedPlayerIds[email]) throw new Error(`Missing ended-session player seat for ${email}.`);
      }
      const endedAliceId = endedPlayerIds['player0001@bombpass.test'];
      const ericId = endedPlayerIds['player0005@bombpass.test'];

      // Winner is assigned after Alice's seat exists; ended-session bomb holder must remain NULL.
      await db.query(
        'UPDATE game_sessions SET winner_player_id = :winner_id, bomb_holder_player_id = NULL WHERE session_id = :session_id',
        { replacements: { winner_id: endedAliceId, session_id: endedSessionId }, transaction: tx }
      );

      const occurrenceSpecs = [
        { session_id: endedSessionId, cycle_number: 1, question_id: question1.question_id, displayed_at: new Date('2026-09-30T08:06:30.000Z') },
        { session_id: endedSessionId, cycle_number: 1, question_id: question2.question_id, displayed_at: new Date('2026-09-30T08:08:00.000Z') },
      ];
      for (const spec of occurrenceSpecs) {
        let occurrence = await firstRow(
          db,
          `SELECT occurrence_id FROM session_question_history
           WHERE session_id = :session_id AND cycle_number = :cycle_number AND question_id = :question_id`,
          { session_id: spec.session_id, cycle_number: spec.cycle_number, question_id: spec.question_id },
          tx
        );
        if (!occurrence) {
          await queryInterface.bulkInsert('session_question_history', [spec], { transaction: tx });
          occurrence = await firstRow(
            db,
            `SELECT occurrence_id FROM session_question_history
             WHERE session_id = :session_id AND cycle_number = :cycle_number AND question_id = :question_id`,
            { session_id: spec.session_id, cycle_number: spec.cycle_number, question_id: spec.question_id },
            tx
          );
        } else {
          await queryInterface.bulkUpdate(
            'session_question_history', { displayed_at: spec.displayed_at },
            { session_id: spec.session_id, cycle_number: spec.cycle_number, question_id: spec.question_id },
            { transaction: tx }
          );
        }
        if (!occurrence) throw new Error(`Failed to resolve history occurrence for question ${spec.question_id}.`);
      }

      const endedOccurrences = await selectRows(
        db,
        'SELECT occurrence_id, question_id FROM session_question_history WHERE session_id = :session_id AND cycle_number = 1',
        { session_id: endedSessionId },
        tx
      );
      const occurrenceIds = Object.fromEntries(endedOccurrences.map((row) => [row.question_id, row.occurrence_id]));
      const occurrence1 = occurrenceIds[question1.question_id];
      const occurrence2 = occurrenceIds[question2.question_id];
      if (!occurrence1 || !occurrence2) throw new Error('One or both ended-session question occurrences are missing.');

      const endedPlayerByName = {
        Alice: endedPlayerIds['player0001@bombpass.test'],
        Bob: endedPlayerIds['player0002@bombpass.test'],
        Charlie: endedPlayerIds['player0003@bombpass.test'],
        Diana: endedPlayerIds['player0004@bombpass.test'],
        Eric: endedPlayerIds['player0005@bombpass.test'],
      };
      const correctChoice1 = choiceByKey[`${question1.question_id}:1`];
      const correctChoice2 = choiceByKey[`${question2.question_id}:2`];
      const wrongChoice1 = choiceByKey[`${question1.question_id}:0`];
      const wrongChoice2 = choiceByKey[`${question2.question_id}:0`];

      const answerSpecs = [
        { player_id: endedPlayerByName.Alice, occurrence_id: occurrence1, choice_id: correctChoice1, answer_status: 'CORRECT', elapsed_ms: 1000, submitted_at: new Date('2026-09-30T08:06:42.000Z') },
        { player_id: endedPlayerByName.Alice, occurrence_id: occurrence2, choice_id: correctChoice2, answer_status: 'CORRECT', elapsed_ms: 1200, submitted_at: new Date('2026-09-30T08:08:18.000Z') },
        { player_id: endedPlayerByName.Bob, occurrence_id: occurrence1, choice_id: correctChoice1, answer_status: 'CORRECT', elapsed_ms: 900, submitted_at: new Date('2026-09-30T08:06:43.000Z') },
        { player_id: endedPlayerByName.Bob, occurrence_id: occurrence2, choice_id: wrongChoice2, answer_status: 'INCORRECT', elapsed_ms: 4000, submitted_at: new Date('2026-09-30T08:08:30.000Z') },
        { player_id: endedPlayerByName.Charlie, occurrence_id: occurrence1, choice_id: correctChoice1, answer_status: 'CORRECT', elapsed_ms: 1500, submitted_at: new Date('2026-09-30T08:06:45.000Z') },
        { player_id: endedPlayerByName.Charlie, occurrence_id: occurrence2, choice_id: null, answer_status: 'TIMEOUT', elapsed_ms: 10000, submitted_at: new Date('2026-09-30T08:08:10.000Z') },
        { player_id: endedPlayerByName.Diana, occurrence_id: occurrence1, choice_id: wrongChoice1, answer_status: 'INCORRECT', elapsed_ms: 3000, submitted_at: new Date('2026-09-30T08:06:50.000Z') },
        { player_id: endedPlayerByName.Eric, occurrence_id: occurrence1, choice_id: wrongChoice1, answer_status: 'INCORRECT', elapsed_ms: 2500, submitted_at: new Date('2026-09-30T08:09:00.000Z') },
      ];
      for (const spec of answerSpecs) {
        const existing = await firstRow(
          db,
          'SELECT answer_id FROM answers WHERE player_id = :player_id AND occurrence_id = :occurrence_id',
          { player_id: spec.player_id, occurrence_id: spec.occurrence_id },
          tx
        );
        if (existing) {
          await queryInterface.bulkUpdate(
            'answers',
            { choice_id: spec.choice_id, answer_status: spec.answer_status, elapsed_ms: spec.elapsed_ms, submitted_at: spec.submitted_at },
            { answer_id: existing.answer_id },
            { transaction: tx }
          );
        } else {
          await queryInterface.bulkInsert('answers', [spec], { transaction: tx });
          const inserted = await firstRow(
            db,
            'SELECT answer_id FROM answers WHERE player_id = :player_id AND occurrence_id = :occurrence_id',
            { player_id: spec.player_id, occurrence_id: spec.occurrence_id },
            tx
          );
          if (!inserted) throw new Error(`Failed to resolve answer fixture for player ${spec.player_id} and occurrence ${spec.occurrence_id}.`);
        }
      }

      const desiredPenaltyDates = [
        new Date('2026-09-30T08:12:00.000Z'),
        new Date('2026-09-30T08:13:00.000Z'),
        new Date('2026-09-30T08:14:00.000Z'),
      ];
      // Normalize this fixture Eric's penalty history to exactly the three approved events.
      await db.query(
        `DELETE FROM penalties
         WHERE player_id = :player_id AND reason = 'bomb_expiration'
           AND created_at NOT IN (:date1, :date2, :date3)`,
        {
          replacements: {
            player_id: ericId,
            date1: desiredPenaltyDates[0],
            date2: desiredPenaltyDates[1],
            date3: desiredPenaltyDates[2],
          },
          transaction: tx,
        }
      );
      for (const createdAt of desiredPenaltyDates) {
        let existing = await firstRow(
          db,
          `SELECT penalty_id FROM penalties
           WHERE player_id = :player_id AND reason = 'bomb_expiration' AND created_at = :created_at`,
          { player_id: ericId, created_at: createdAt },
          tx
        );
        if (!existing) {
          await queryInterface.bulkInsert('penalties', [{
            player_id: ericId,
            reason: 'bomb_expiration',
            created_at: createdAt,
          }], { transaction: tx });
          existing = await firstRow(
            db,
            `SELECT penalty_id FROM penalties
             WHERE player_id = :player_id AND reason = 'bomb_expiration' AND created_at = :created_at`,
            { player_id: ericId, created_at: createdAt },
            tx
          );
        }
        if (!existing) throw new Error(`Failed to resolve Eric's penalty event at ${createdAt.toISOString()}.`);
      }

      for (const email of [
        'player0001@bombpass.test',
        'player0002@bombpass.test',
        'player0003@bombpass.test',
      ]) {
        const userId = userIds[email];
        const awardSpec = {
          user_id: userId,
          session_id: endedSessionId,
          amount: 5,
          reason: 'SESSION_COMPLETION',
          awarded_at: new Date('2026-09-30T08:19:00.000Z'),
        };
        let existing = await firstRow(
          db,
          `SELECT exp_transaction_id FROM exp_transactions
           WHERE user_id = :user_id AND session_id = :session_id AND reason = 'SESSION_COMPLETION'`,
          { user_id: userId, session_id: endedSessionId },
          tx
        );
        if (existing) {
          await queryInterface.bulkUpdate(
            'exp_transactions', { amount: awardSpec.amount, awarded_at: awardSpec.awarded_at },
            { exp_transaction_id: existing.exp_transaction_id }, { transaction: tx }
          );
        } else {
          await queryInterface.bulkInsert('exp_transactions', [awardSpec], { transaction: tx });
          existing = await firstRow(
            db,
            `SELECT exp_transaction_id FROM exp_transactions
             WHERE user_id = :user_id AND session_id = :session_id AND reason = 'SESSION_COMPLETION'`,
            { user_id: userId, session_id: endedSessionId },
            tx
          );
        }
        if (!existing) throw new Error(`Failed to resolve SESSION_COMPLETION award for ${email}.`);
      }

      // Running-session fixture: a separate live session, with its own players and holder seat.
      const runningSessionValues = {
        host_user_id: host.user_id,
        question_set_id: questionSet.question_set_id,
        join_code: '202502',
        status: 'playing',
        created_at: new Date('2026-09-30T08:20:00.000Z'),
        started_at: new Date('2026-09-30T08:20:00.000Z'),
        ended_at: null,
        duration_limit_minutes: 15,
        session_end_reason: null,
        bomb_holder_player_id: null,
        bomb_time_limit_seconds: 30,
        bomb_expires_at: new Date('2026-09-30T08:20:30.000Z'),
        current_question_id: question2.question_id,
        current_cycle_number: 1,
        question_expires_at: new Date('2026-09-30T08:20:10.000Z'),
        winner_player_id: null,
      };
      let runningSession = await firstRow(
        db,
        'SELECT session_id FROM game_sessions WHERE join_code = :join_code',
        { join_code: '202502' },
        tx
      );
      if (!runningSession) {
        await queryInterface.bulkInsert('game_sessions', [runningSessionValues], { transaction: tx });
        runningSession = await firstRow(
          db,
          'SELECT session_id FROM game_sessions WHERE join_code = :join_code',
          { join_code: '202502' },
          tx
        );
      }
      if (!runningSession) throw new Error('Failed to resolve running fixture session 202502 after insert.');
      const runningSessionId = runningSession.session_id;
      await queryInterface.bulkUpdate(
        'game_sessions',
        { ...runningSessionValues, winner_player_id: null, bomb_holder_player_id: null },
        { session_id: runningSessionId },
        { transaction: tx }
      );

      // Record the currently displayed question for the running session too.
      const runningOccurrence = {
        session_id: runningSessionId,
        cycle_number: 1,
        question_id: question2.question_id,
        displayed_at: new Date('2026-09-30T08:20:00.000Z'),
      };
      const existingRunningOccurrence = await firstRow(
        db,
        `SELECT occurrence_id FROM session_question_history
         WHERE session_id = :session_id AND cycle_number = :cycle_number AND question_id = :question_id`,
        { session_id: runningSessionId, cycle_number: 1, question_id: question2.question_id },
        tx
      );
      if (existingRunningOccurrence) {
        await queryInterface.bulkUpdate(
          'session_question_history', { displayed_at: runningOccurrence.displayed_at },
          { occurrence_id: existingRunningOccurrence.occurrence_id }, { transaction: tx }
        );
      } else {
        await queryInterface.bulkInsert('session_question_history', [runningOccurrence], { transaction: tx });
      }

      const runningPlayerSpecs = [
        {
          user_id: userIds['player0001@bombpass.test'], session_id: runningSessionId, nickname: 'Alice', score: 0,
          player_status: 'ACTIVE', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:20:05.000Z'), last_seen_at: new Date('2026-09-30T08:20:05.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null, finished_at: null, final_rank: null,
        },
        {
          user_id: userIds['player0002@bombpass.test'], session_id: runningSessionId, nickname: 'Bob', score: 0,
          player_status: 'ACTIVE', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:20:06.000Z'), last_seen_at: new Date('2026-09-30T08:20:06.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null, finished_at: null, final_rank: null,
        },
        {
          user_id: userIds['player0003@bombpass.test'], session_id: runningSessionId, nickname: 'Charlie', score: 0,
          player_status: 'ACTIVE', connection_status: 'DISCONNECTED',
          joined_at: new Date('2026-09-30T08:20:07.000Z'), last_seen_at: new Date('2026-09-30T08:20:08.000Z'),
          disconnected_at: new Date('2026-09-30T08:20:08.000Z'), eliminated_at: null, forfeited_at: null, finished_at: null, final_rank: null,
        },
        {
          user_id: userIds['player0004@bombpass.test'], session_id: runningSessionId, nickname: 'Diana', score: 0,
          player_status: 'ACTIVE', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:20:09.000Z'), last_seen_at: new Date('2026-09-30T08:20:09.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null, finished_at: null, final_rank: null,
        },
        {
          user_id: userIds['player0005@bombpass.test'], session_id: runningSessionId, nickname: 'Eric', score: 0,
          player_status: 'ACTIVE', connection_status: 'CONNECTED',
          joined_at: new Date('2026-09-30T08:20:10.000Z'), last_seen_at: new Date('2026-09-30T08:20:10.000Z'),
          disconnected_at: null, eliminated_at: null, forfeited_at: null, finished_at: null, final_rank: null,
        },
      ];

      await db.query(
        `UPDATE players SET final_rank = NULL
         WHERE session_id = :session_id AND user_id IN (:alice_id, :bob_id, :charlie_id, :diana_id, :eric_id)`,
        {
          replacements: {
            session_id: runningSessionId,
            alice_id: userIds['player0001@bombpass.test'],
            bob_id: userIds['player0002@bombpass.test'],
            charlie_id: userIds['player0003@bombpass.test'],
            diana_id: userIds['player0004@bombpass.test'],
            eric_id: userIds['player0005@bombpass.test'],
          },
          transaction: tx,
        }
      );
      for (const spec of runningPlayerSpecs) {
        const existing = await firstRow(
          db,
          'SELECT player_id FROM players WHERE session_id = :session_id AND user_id = :user_id',
          { session_id: runningSessionId, user_id: spec.user_id },
          tx
        );
        const values = { ...spec };
        delete values.session_id;
        delete values.user_id;
        if (existing) {
          await queryInterface.bulkUpdate(
            'players', values,
            { player_id: existing.player_id, session_id: runningSessionId, user_id: spec.user_id },
            { transaction: tx }
          );
        } else {
          await queryInterface.bulkInsert('players', [spec], { transaction: tx });
          const inserted = await firstRow(
            db,
            'SELECT player_id FROM players WHERE session_id = :session_id AND user_id = :user_id',
            { session_id: runningSessionId, user_id: spec.user_id },
            tx
          );
          if (!inserted) throw new Error(`Failed to resolve running-session player ${spec.nickname}.`);
        }
      }

      const runningAlice = await requireRow(
        db,
        'SELECT player_id FROM players WHERE session_id = :session_id AND user_id = :user_id',
        { session_id: runningSessionId, user_id: userIds['player0001@bombpass.test'] },
        tx,
        'Alice\'s running-session seat'
      );
      await db.query(
        'UPDATE game_sessions SET bomb_holder_player_id = :holder_id, winner_player_id = NULL WHERE session_id = :session_id AND status = :status',
        { replacements: { holder_id: runningAlice.player_id, session_id: runningSessionId, status: 'playing' }, transaction: tx }
      );

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
      // Clear circular session-to-player foreign keys before deleting fixture seats.
      await db.query(
        "UPDATE game_sessions SET bomb_holder_player_id = NULL, winner_player_id = NULL WHERE join_code IN ('202501', '202502')",
        { transaction: tx }
      );
      await db.query(
        "DELETE FROM exp_transactions WHERE session_id IN (SELECT session_id FROM game_sessions WHERE join_code IN ('202501', '202502'))",
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM penalties
         WHERE player_id IN (SELECT player_id FROM players
                             WHERE session_id IN (SELECT session_id FROM game_sessions WHERE join_code IN ('202501', '202502')))`,
        { transaction: tx }
      );
      await db.query(
        `DELETE FROM answers
         WHERE player_id IN (SELECT player_id FROM players
                             WHERE session_id IN (SELECT session_id FROM game_sessions WHERE join_code IN ('202501', '202502')))`,
        { transaction: tx }
      );
      await db.query(
        "DELETE FROM session_question_history WHERE session_id IN (SELECT session_id FROM game_sessions WHERE join_code IN ('202501', '202502'))",
        { transaction: tx }
      );
      await db.query(
        "DELETE FROM players WHERE session_id IN (SELECT session_id FROM game_sessions WHERE join_code IN ('202501', '202502'))",
        { transaction: tx }
      );
      await db.query("DELETE FROM game_sessions WHERE join_code IN ('202501', '202502')", { transaction: tx });
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  },
};
