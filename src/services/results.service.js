// Hub Contract rule 7: builds the results of finished games in the shared format.
const resultsRepository = require('../repositories/results.repository');
const { rankPlayers } = require('../utils/rank-players');

async function listFinishedGames(since) {
  const rows = await resultsRepository.findFinishedGamePlayers(since);

  const games = new Map();
  for (const row of rows) {
    if (!games.has(row.session_code)) {
      games.set(row.session_code, {
        session_code: String(row.session_code),
        started_at: row.started_at ? new Date(row.started_at).toISOString() : null,
        ended_at: new Date(row.ended_at).toISOString(),
        players: [],
      });
    }
    games.get(row.session_code).players.push({
      school_id: String(row.school_id),
      nickname: String(row.nickname),
      score: Number(row.score),
      completed: Boolean(row.completed),
    });
  }

  return [...games.values()]
    .sort((a, b) => a.ended_at.localeCompare(b.ended_at))
    .map((game) => {
      const players = rankPlayers(game.players);
      const podium = players
        .filter((p) => p.rank !== null && p.rank <= 3)
        .map(({ rank, school_id: schoolId, nickname, score }) => ({ rank, school_id: schoolId, nickname, score }));
      return { ...game, players, podium };
    });
}

module.exports = { listFinishedGames, rankPlayers };
