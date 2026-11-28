// Model = the JavaScript view of ONE table. Column rules live in the migration;
// the model only tells Sequelize how to read and write the table.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Answer',
    {
      answer_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      player_id: { type: DataTypes.INTEGER, allowNull: false },
      occurrence_id: { type: DataTypes.INTEGER, allowNull: false },
      question_id: { type: DataTypes.INTEGER, allowNull: false },
      choice_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
      answer_status: { type: DataTypes.STRING(12), allowNull: false },
      elapsed_ms: { type: DataTypes.INTEGER, allowNull: false },
      submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'answers', timestamps: false }
  );