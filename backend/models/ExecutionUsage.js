const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExecutionUsage = sequelize.define('ExecutionUsage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  usageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  runCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'execution_usages',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'usageDate'] },
    { fields: ['usageDate'] }
  ]
});

module.exports = ExecutionUsage;
