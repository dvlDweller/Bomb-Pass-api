const { rankPlayers } = require('../../src/utils/rank-players');

test('equal scores share a rank and next distinct score skips', () => {
  const ranked = rankPlayers([
    { nickname: 'Rina', score: 6824, completed: true },
    { nickname: 'Dale', score: 3900, completed: true },
    { nickname: 'Pao', score: 3900, completed: true },
    { nickname: 'Ana', score: 100, completed: true },
  ]);
  expect(ranked.map((r) => [r.nickname, r.rank])).toEqual([
    ['Rina', 1], ['Dale', 2], ['Pao', 2], ['Ana', 4],
  ]);
});

test('non-completed /results players retain rank null', () => {
  const ranked = rankPlayers([
    { nickname: 'Rina', score: 100, completed: true },
    { nickname: 'Lia', score: 9000, completed: false },
  ]);
  expect(ranked.find((r) => r.nickname === 'Lia').rank).toBeNull();
  expect(ranked.find((r) => r.nickname === 'Rina').rank).toBe(1);
});

test('leaderboard ranks all supplied players', () => {
  const ranked = rankPlayers([
    { nickname: 'A', score: 10 },
    { nickname: 'B', score: 10 },
    { nickname: 'C', score: 5 },
  ]);
  expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
});

test('secondary ordering does not split equal-score ranks', () => {
  const ranked = rankPlayers([
    { nickname: 'B', score: 10, penalty_count: 2 },
    { nickname: 'A', score: 10, penalty_count: 1 },
  ]);
  expect(ranked[0].rank).toBe(1);
  expect(ranked[1].rank).toBe(1);
});
