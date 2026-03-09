const User = require('./User');
const Project = require('./Project');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Badge = require('./Badge');
const Notification = require('./Notification');
const ExecutionUsage = require('./ExecutionUsage');

// User -> Projects (Teacher creates many projects)
User.hasMany(Project, {
  foreignKey: 'teacherId',
  as: 'projects'
});
Project.belongsTo(User, {
  foreignKey: 'teacherId',
  as: 'teacher'
});

// Project -> Assignments (Project assigned to many students)
Project.hasMany(Assignment, {
  foreignKey: 'projectId',
  as: 'assignments'
});
Assignment.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

// User -> Assignments (Student has many assignments)
User.hasMany(Assignment, {
  foreignKey: 'studentId',
  as: 'assignments'
});
Assignment.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student'
});

// Assignment -> Submission (One-to-one)
Assignment.hasOne(Submission, {
  foreignKey: 'assignmentId',
  as: 'submission'
});
Submission.belongsTo(Assignment, {
  foreignKey: 'assignmentId',
  as: 'assignment'
});

// User -> Badges
User.hasMany(Badge, {
  foreignKey: 'userId',
  as: 'badges'
});
Badge.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Teacher (awarder) -> Badges
User.hasMany(Badge, {
  foreignKey: 'awardedBy',
  as: 'awardedBadges'
});
Badge.belongsTo(User, {
  foreignKey: 'awardedBy',
  as: 'awardedByUser'
});

// Project -> Badges (optional relation)
Project.hasMany(Badge, {
  foreignKey: 'projectId',
  as: 'badges'
});
Badge.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

// User -> Notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Daily code execution usage
User.hasMany(ExecutionUsage, {
  foreignKey: 'userId',
  as: 'executionUsages'
});
ExecutionUsage.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Project,
  Assignment,
  Submission,
  Badge,
  Notification,
  ExecutionUsage
};
