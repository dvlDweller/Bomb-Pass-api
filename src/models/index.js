// ONE Sequelize instance (one connection pool) for the whole API.
// Every other file imports it from here - nobody opens a second one.
const { Sequelize, DataTypes } = require('sequelize');
const env = require('../config/env');
const dbConfig = require('../config/database')[env.nodeEnv];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const User = require('./user')(sequelize, DataTypes);
const QuestionSet = require('./question-set')(sequelize, DataTypes);
const GameSession = require('./game-session')(sequelize, DataTypes);
const Player = require('./player')(sequelize, DataTypes);

// Associations (foreign keys come from the migrations)
// QuestionSet <-> User : question_sets.owner_user_id -> users.user_id
QuestionSet.belongsTo(User, { foreignKey: 'owner_user_id' });
User.hasMany(QuestionSet, { foreignKey: 'owner_user_id' });

// GameSession <-> User : game_sessions.host_user_id -> users.user_id
GameSession.belongsTo(User, { foreignKey: 'host_user_id', as: 'host' });
User.hasMany(GameSession, { foreignKey: 'host_user_id', as: 'hostedSessions' });

// GameSession <-> QuestionSet : game_sessions.question_set_id -> question_sets.question_set_id
GameSession.belongsTo(QuestionSet, { foreignKey: 'question_set_id' });
QuestionSet.hasMany(GameSession, { foreignKey: 'question_set_id' });

// GameSession <-> Player : game_sessions.bomb_holder_player_id -> players.player_id
GameSession.belongsTo(Player, { foreignKey: 'bomb_holder_player_id', as: 'bombHolder' });
Player.hasMany(GameSession, { foreignKey: 'bomb_holder_player_id', as: 'bombHolderSessions' });
// GameSession <-> Player : game_sessions.winner_player_id -> players.player_id
GameSession.belongsTo(Player, { foreignKey: 'winner_player_id', as: 'winner' });
Player.hasMany(GameSession, { foreignKey: 'winner_player_id', as: 'winnerSessions' });

// Player <-> GameSession : players.session_id -> game_sessions.session_id
Player.belongsTo(GameSession, { foreignKey: 'session_id' });
GameSession.hasMany(Player, { foreignKey: 'session_id' });

// Player <-> User : players.user_id -> users.user_id
Player.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Player, { foreignKey: 'user_id' });

module.exports = { sequelize, Sequelize, DataTypes, User, QuestionSet, GameSession, Player };
