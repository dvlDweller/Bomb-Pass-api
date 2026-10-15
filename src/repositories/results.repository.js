// Hub Contract rule 7. YOUR WORK (Lab Step 8): write the query for YOUR tables.
//
// Return one row per player per FINISHED game (a game whose status is 'ended'), with exactly these names:
//
//   session_code   the six-digit join code of the game
//   started_at     when the game started (may be null)
//   ended_at       when the game ended
//   school_id      the player's school ID, from your users table
//   nickname       the nickname the player used in that game
//   score          the player's final score
//   completed      true or false: did this player complete the game?
//                  A player is considered to have completed the game if their player_status is 'FINISHED'.
//                  Players with any other status (e.g., 'ELIMINATED', 'FORFEITED') are considered not completed.
//                  TIMEOUT answer events do not automatically disqualify a player.
//
// If "since" is given, return only games that ended after it.
//
// An example for a design with game_sessions, players and users tables:
//
//   SELECT s.join_pin AS session_code, s.started_at, s.ended_at,
//          u.school_id, p.nickname, p.score,
//          (p.player_status = 'FINISHED') AS completed
//     FROM game_sessions s
//     JOIN players p ON p.session_id = s.session_id
//     JOIN users u ON u.user_id = p.user_id
//    WHERE s.status = 'ended'
//      AND (CAST(:since AS timestamptz) IS NULL OR s.ended_at > CAST(:since AS timestamptz))
//    ORDER BY s.ended_at, p.score DESC
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

async function findFinishedGamePlayers(since) {
  const sql = `
SELECT s.join_code AS session_code,
           s.started_at,
           s.ended_at,
           u.school_id,
           p.nickname,
           p.score,
           (p.player_status = 'FINISHED') AS completed
      FROM game_sessions s
      JOIN players p ON p.session_id = s.session_id
      JOIN users u ON u.user_id = p.user_id
     WHERE s.status = 'ended'
       AND (CAST(:since AS timestamptz) IS NULL OR s.ended_at > CAST(:since AS timestamptz))
    ORDER BY s.ended_at, p.score DESC
  `;

  return sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { since: since ? since.toISOString() : null },
  });
}

module.exports = { findFinishedGamePlayers };