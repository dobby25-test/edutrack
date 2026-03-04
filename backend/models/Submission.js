const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'assignments',
      key: 'id'
    }
  },
  codeContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  fileUrls: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true
  },
  studentComments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  teacherFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  marks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'graded'),
    defaultValue: 'draft'
  }
}, {
  tableName: 'submissions',
  timestamps: true
});

module.exports = Submission;
