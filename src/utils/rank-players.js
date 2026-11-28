// Shared M3 score-rank calculation.
function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = a.penalty_count == null ? 0 : Number(a.penalty_count);
    const pb = b.penalty_count == null ? 0 : Number(b.penalty_count);
    if (pa !== pb) return pa - pb;
    const ja = a.joined_at ? new Date(a.joined_at).getTime() : 0;
    const jb = b.joined_at ? new Date(b.joined_at).getTime() : 0;
    if (ja !== jb) return ja - jb;
    if (a.player_id != null && b.player_id != null && a.player_id !== b.player_id) {
      return a.player_id - b.player_id;
    }
    return String(a.nickname || '').localeCompare(String(b.nickname || ''));
  });

  let rank = 0;
  let previous = null;
  let seen = 0;
  return sorted.map((player) => {
    const eligible = player.completed === undefined ? true : Boolean(player.completed);
    if (eligible) {
      seen += 1;
      if (player.score !== previous) rank = seen;
      previous = player.score;
    }
    return { ...player, rank: eligible ? rank : null };
  });
}

module.exports = { rankPlayers };
