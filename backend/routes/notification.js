
const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Get my notifications
router.get('/', authenticateToken, getMyNotifications);

// Mark as read
router.put('/:id/read', authenticateToken, markAsRead);

// Mark all as read
router.put('/read-all', authenticateToken, markAllAsRead);

// Delete notification
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;