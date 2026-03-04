const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'early_bird',
      'perfect_score',
      'first_blood',
      'streak_master',
      'night_owl',
      'quick_learner',
      'outstanding_work',
      'creative_genius',
      'code_champion',
      'problem_solver',
      'most_improved',
      'bronze_tier',
      'silver_tier',
      'gold_tier'
    ),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '🏆',
  },
  awardedBy: {
    type: DataTypes.INTEGER, // Teacher ID if manually awarded
    allowNull: true,
  },
  projectId: {
    type: DataTypes.INTEGER, // Related project if applicable
    allowNull: true,
  },
  isAutomatic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  awardedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Badges',
  timestamps: true,
});

module.exports = Badge;
