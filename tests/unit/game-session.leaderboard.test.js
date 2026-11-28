jest.mock('../../src/repositories/game-session.repository');

const gameSessionRepository = require('../../src/repositories/game-session.repository');
const { leaderboard } = require('../../src/services/game-session.service');

describe('game-session leaderboard', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 for unknown session', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue(null);
    await expect(leaderboard('123456', 10)).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  test('returns empty array when no players', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ session_id: 10 });
    gameSessionRepository.listPlayersByScore.mockResolvedValue([]);
    const result = await leaderboard('123456', 10);
    expect(result).toEqual([]);
  });

  test('forwards limit and maps fields with shared ranks', async () => {
    gameSessionRepository.findByJoinCode.mockResolvedValue({ session_id: 10 });
    gameSessionRepository.listPlayersByScore.mockResolvedValue([
      { player_id: 1, nickname: 'Alice', score: 20, player_status: 'FINISHED', penalty_count: 0, joined_at: new Date('2026-01-01'), },
      { player_id: 2, nickname: 'Bob', score: 20, player_status: 'ACTIVE', penalty_count: 1, joined_at: new Date('2026-01-02'), },
      { player_id: 3, nickname: 'Carol', score: 10, player_status: 'ELIMINATED', penalty_count: 0, joined_at: new Date('2026-01-03'), },
    ]);
    const result = await leaderboard('123456', 5);
    expect(gameSessionRepository.listPlayersByScore).toHaveBeenCalledWith(10, 5);
    expect(result).toEqual([
      { rank: 1, nickname: 'Alice', score: 20, player_status: 'FINISHED' },
      { rank: 1, nickname: 'Bob', score: 20, player_status: 'ACTIVE' },
      { rank: 3, nickname: 'Carol', score: 10, player_status: 'ELIMINATED' },
    ]);
  });
});
