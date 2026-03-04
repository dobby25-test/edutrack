const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('assigned', 'in_progress', 'submitted', 'graded'),
    defaultValue: 'assigned'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'assignments',
  timestamps: true
});

module.exports = Assignment;