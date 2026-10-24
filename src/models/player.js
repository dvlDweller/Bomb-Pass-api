// Model = the JavaScript view of ONE table. Column rules live in the migration;
// the model only tells Sequelize how to read and write the table.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Player',
    {
      player_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      session_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      nickname: { type: DataTypes.STRING(24), allowNull: false },
      score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      player_status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'JOINED' },
      connection_status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'CONNECTED' },
      joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      last_seen_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      disconnected_at: { type: DataTypes.DATE, allowNull: true },
      eliminated_at: { type: DataTypes.DATE, allowNull: true },
      forfeited_at: { type: DataTypes.DATE, allowNull: true },
      finished_at: { type: DataTypes.DATE, allowNull: true },
      final_rank: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'players', timestamps: false }
  );
