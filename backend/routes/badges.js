const express = require('express');
const router = express.Router();
const {
  awardBadge,
  getMyBadges,
} = require('../controllers/badgeController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get my badges
router.get('/my-badges', authenticateToken, getMyBadges);

// Award badge (Teacher only)
router.post(
  '/award',
  authenticateToken,
  checkRole('teacher'),
  awardBadge
);

module.exports = router;
