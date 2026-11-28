// Model = the JavaScript view of ONE table. Column rules live in the migration;
// the model only tells Sequelize how to read and write the table.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'SessionQuestionHistory',
    {
      occurrence_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      session_id: { type: DataTypes.INTEGER, allowNull: false },
      cycle_number: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      question_id: { type: DataTypes.INTEGER, allowNull: false },
      displayed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'session_question_history', timestamps: false }
  );