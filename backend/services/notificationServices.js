const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 */
const createNotification = async (userId, { type, title, message, icon, link }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      icon: icon || getIconForType(type),
      link,
    });
    
    console.log(`📬 Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

/**
 * Create notifications for multiple users
 */
const createBulkNotifications = async (userIds, notification) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notification,
      icon: notification.icon || getIconForType(notification.type),
    }));
    
    await Notification.bulkCreate(notifications);
    console.log(`📬 Bulk notifications created for ${userIds.length} users`);
  } catch (error) {
    console.error('Create bulk notifications error:', error);
  }
};

/**
 * Get icon based on notification type
 */
function getIconForType(type) {
  const icons = {
    assignment: '📝',
    grade: '✅',
    badge: '🏆',
    deadline: '⏰',
    announcement: '📢',
  };
  return icons[type] || '🔔';
}

/**
 * Notify on new assignment
 */
const notifyNewAssignment = async (studentId, project, teacher) => {
  await createNotification(studentId, {
    type: 'assignment',
    title: 'New Assignment',
    message: `${teacher.name} assigned "${project.title}"`,
    link: '/student/dashboard',
  });
};

/**
 * Notify on graded submission
 */
const notifyGrade = async (studentId, project, marks, maxMarks) => {
  const percentage = Math.round((marks / maxMarks) * 100);
  await createNotification(studentId, {
    type: 'grade',
    title: 'Assignment Graded',
    message: `You scored ${marks}/${maxMarks} (${percentage}%) on "${project.title}"`,
    link: '/student/dashboard',
  });
};

/**
 * Notify on badge earned
 */
const notifyBadge = async (studentId, badgeName, badgeIcon) => {
  await createNotification(studentId, {
    type: 'badge',
    title: 'Badge Earned!',
    message: `You earned the "${badgeName}" badge! 🎉`,
    icon: badgeIcon,
    link: '/student/profile',
  });
};

/**
 * Notify deadline reminder (for batch jobs)
 */
const notifyDeadline = async (studentId, project, hoursLeft) => {
  await createNotification(studentId, {
    type: 'deadline',
    title: 'Deadline Reminder',
    message: `"${project.title}" is due in ${hoursLeft} hours!`,
    link: '/student/dashboard',
  });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyNewAssignment,
  notifyGrade,
  notifyBadge,
  notifyDeadline,
};