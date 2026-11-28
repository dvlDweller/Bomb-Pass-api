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
const Question = require('./question')(sequelize, DataTypes);
const Choice = require('./choice')(sequelize, DataTypes);
const GameSession = require('./game-session')(sequelize, DataTypes);
const Player = require('./player')(sequelize, DataTypes);
const Answer = require('./answer')(sequelize, DataTypes);
const SessionQuestionHistory = require('./session-question-history')(sequelize, DataTypes);

// Associations (foreign keys come from the migrations)
// QuestionSet <-> User : question_sets.owner_user_id -> users.user_id
QuestionSet.belongsTo(User, { foreignKey: 'owner_user_id' });
User.hasMany(QuestionSet, { foreignKey: 'owner_user_id' });

// QuestionSet <-> Question : questions.question_set_id -> question_sets.question_set_id
QuestionSet.hasMany(Question, { foreignKey: 'question_set_id', as: 'questions' });
Question.belongsTo(QuestionSet, { foreignKey: 'question_set_id', as: 'questionSet' });

// Question <-> Choice : choices.question_id -> questions.question_id
Question.hasMany(Choice, { foreignKey: 'question_id', as: 'choices' });
Choice.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

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

// GameSession <-> SessionQuestionHistory : session_question_history.session_id -> game_sessions.session_id
GameSession.hasMany(SessionQuestionHistory, { foreignKey: 'session_id' });
SessionQuestionHistory.belongsTo(GameSession, { foreignKey: 'session_id' });

// Question <-> SessionQuestionHistory : session_question_history.question_id -> questions.question_id
Question.hasMany(SessionQuestionHistory, { foreignKey: 'question_id' });
SessionQuestionHistory.belongsTo(Question, { foreignKey: 'question_id' });

// Player <-> Answer : answers.player_id -> players.player_id
Player.hasMany(Answer, { foreignKey: 'player_id' });
Answer.belongsTo(Player, { foreignKey: 'player_id' });

// SessionQuestionHistory <-> Answer : answers.occurrence_id -> session_question_history.occurrence_id
SessionQuestionHistory.hasMany(Answer, { foreignKey: 'occurrence_id' });
Answer.belongsTo(SessionQuestionHistory, { foreignKey: 'occurrence_id' });

// Question <-> Answer : answers.question_id -> questions.question_id
Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

// Choice <-> Answer : answers.choice_id -> choices.choice_id
Choice.hasMany(Answer, { foreignKey: 'choice_id' });
Answer.belongsTo(Choice, { foreignKey: 'choice_id' });

module.exports = { sequelize, Sequelize, DataTypes, User, QuestionSet, Question, Choice, GameSession, Player, Answer, SessionQuestionHistory };
