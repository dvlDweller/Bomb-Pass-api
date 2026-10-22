// Model = the JavaScript view of ONE table. Column rules live in the migration;
// the model only tells Sequelize how to read and write the table.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'GameSession',
    {
      session_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      host_user_id: { type: DataTypes.INTEGER, allowNull: false },
      question_set_id: { type: DataTypes.INTEGER, allowNull: false },
      join_code: { type: DataTypes.CHAR(6), allowNull: false },
      status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'waiting' },
      duration_limit_minutes: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 10 },
      bomb_time_limit_seconds: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 30 },
      session_end_reason: { type: DataTypes.STRING(20), allowNull: true },
      bomb_holder_player_id: { type: DataTypes.INTEGER, allowNull: true },
      bomb_expires_at: { type: DataTypes.DATE, allowNull: true },
      current_question_id: { type: DataTypes.INTEGER, allowNull: true },
      current_cycle_number: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      question_expires_at: { type: DataTypes.DATE, allowNull: true },
      winner_player_id: { type: DataTypes.INTEGER, allowNull: true },
      started_at: { type: DataTypes.DATE, allowNull: true },
      ended_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'game_sessions', timestamps: true, createdAt: 'created_at', updatedAt: false }
  );
