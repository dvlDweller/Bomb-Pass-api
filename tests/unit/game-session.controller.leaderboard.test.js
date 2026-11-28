// Unit tests for leaderboard controller serialization.
jest.mock('../../src/services/game-session.service');
jest.mock('express-validator', () => ({
  matchedData: jest.fn((req, options) => {
    if (options && options.locations && options.locations[0] === 'params') {
      return { code: '123456' };
    }
    if (options && options.locations && options.locations[0] === 'query') {
      if (req && req.query && req.query.limit !== undefined) {
        return { limit: req.query.limit };
      }
      return {};
    }
    return {};
  }),
}));

const gameSessionService = require('../../src/services/game-session.service');
const gameSessionController = require('../../src/controllers/game-session.controller');
const { matchedData } = require('express-validator');

describe('game-session.controller.leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes default limit 10 when missing', async () => {
    gameSessionService.leaderboard.mockResolvedValue([]);
    const req = { params: { code: '123456' }, query: {} };
    let responseBody;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn((b) => { responseBody = b; }) };
    await gameSessionController.leaderboard(req, res);
    expect(gameSessionService.leaderboard).toHaveBeenCalledWith('123456', 10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(responseBody).toEqual({ leaderboard: [] });
  });

  test('passes supplied valid limit as integer', async () => {
    gameSessionService.leaderboard.mockResolvedValue([]);
    const req = { params: { code: '123456' }, query: { limit: '5' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await gameSessionController.leaderboard(req, res);
    expect(gameSessionService.leaderboard).toHaveBeenCalledWith('123456', 5);
  });
});
