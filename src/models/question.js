// Model = the JavaScript view of ONE table. Column rules live in the migration;
// the model only tells Sequelize how to read and write the table.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Question',
    {
      question_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      question_set_id: { type: DataTypes.INTEGER, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'multiple_choice' },
      correct_index: { type: DataTypes.SMALLINT, allowNull: false },
      time_limit_seconds: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 15 },
    },
    { tableName: 'questions', timestamps: false }
  );