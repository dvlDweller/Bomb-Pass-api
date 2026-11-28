jest.mock('../../src/repositories/game-session.repository');
jest.mock('../../src/repositories/question.repository');
jest.mock('../../src/repositories/session-question-history.repository');
jest.mock('../../src/models', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };
  return { sequelize: { transaction: jest.fn(async () => transaction) } };
});

const gameSessionRepository = require('../../src/repositories/game-session.repository');
const { changeStatus, calculateFinalRanks } = require('../../src/services/game-session.service');

describe('game-session finalization', () => {
  beforeEach(() => jest.clearAllMocks());

  test('host-ended finalizes active players and persists unique final ranks', async () => {
    const session = { status: 'playing', host_user_id: 1, session_id: 10 };
    gameSessionRepository.findByJoinCode.mockResolvedValue(session);
    gameSessionRepository.update.mockResolvedValue({ ...session, status: 'ended' });
    gameSessionRepository.finalizeActivePlayers.mockResolvedValue([1]);
    gameSessionRepository.findPlayersForFinalRanking.mockResolvedValue([
      { player_id: 1, player_status: 'FINISHED', score: 20, penalty_count: 0, joined_at: new Date('2026-01-01'), eliminated_at: null, forfeited_at: null },
      { player_id: 2, player_status: 'ELIMINATED', score: 10, penalty_count: 1, joined_at: new Date('2026-01-02'), eliminated_at: new Date('2026-01-03'), forfeited_at: null },
      { player_id: 3, player_status: 'FORFEITED', score: 5, penalty_count: 0, joined_at: new Date('2026-01-04'), eliminated_at: null, forfeited_at: new Date('2026-01-05') },
      { player_id: 4, player_status: 'JOINED', score: 0, penalty_count: 0, joined_at: new Date('2026-01-06'), eliminated_at: null, forfeited_at: null },
    ]);
    gameSessionRepository.setFinalRanks.mockResolvedValue(null);

    const user = { user_id: 1, role: 'HOST' };
    await changeStatus('123456', 'ended', user);

    const changes = gameSessionRepository.update.mock.calls[0][1];
    expect(changes.status).toBe('ended');
    expect(changes.session_end_reason).toBe('host_ended');
    expect(changes.winner_player_id).toBeNull();
    expect(changes.ended_at).toBeInstanceOf(Date);

    expect(gameSessionRepository.finalizeActivePlayers).toHaveBeenCalledWith(10, changes.ended_at, { transaction: expect.any(Object) });

    const ranks = gameSessionRepository.setFinalRanks.mock.calls[0][1];
    const placements = ranks.map((r) => r.final_rank);
    expect(new Set(placements).size).toBe(placements.length);
    expect(placements).toEqual([1, 2, 3, 4]);

    const t = gameSessionRepository.finalizeActivePlayers.mock.calls[0][2].transaction;
    expect(gameSessionRepository.findPlayersForFinalRanking).toHaveBeenCalledWith(10, { transaction: t });
    expect(gameSessionRepository.setFinalRanks).toHaveBeenCalledWith(10, ranks, { transaction: t });
    expect(gameSessionRepository.update).toHaveBeenCalledWith(expect.any(Object), changes, { transaction: t });
  });

  test('calculateFinalRanks produces sequential unique placements', () => {
    const ranks = calculateFinalRanks([
      { player_id: 1, player_status: 'FINISHED', score: 20, penalty_count: 0, joined_at: new Date('2026-01-01') },
      { player_id: 2, player_status: 'ELIMINATED', score: 10, penalty_count: 0, joined_at: new Date('2026-01-02'), eliminated_at: new Date('2026-01-03') },
    ], null);
    expect(ranks.map((r) => r.final_rank)).toEqual([1, 2]);
  });
});
