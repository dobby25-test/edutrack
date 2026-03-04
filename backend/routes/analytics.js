const express = require('express');
const router = express.Router();
const {
  getStudentAnalytics,
  getTeacherAnalytics,
  getDirectorAnalytics,
} = require('../controllers/analyticsController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Student analytics
router.get('/student/:studentId', authenticateToken, getStudentAnalytics);

// Teacher analytics
router.get(
  '/teacher/:teacherId',
  authenticateToken,
  checkRole('teacher', 'director'),
  getTeacherAnalytics
);

// Director analytics
router.get(
  '/director',
  authenticateToken,
  checkRole('director'),
  getDirectorAnalytics
);

module.exports = router;
