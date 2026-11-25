// Model = the JavaScript view of ONE table. Column rules live in the migration;
// the model only tells Sequelize how to read and write the table.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Choice',
    {
      choice_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      question_id: { type: DataTypes.INTEGER, allowNull: false },
      choice_index: { type: DataTypes.SMALLINT, allowNull: false },
      text: { type: DataTypes.STRING(120), allowNull: false },
    },
    { tableName: 'choices', timestamps: false }
  );