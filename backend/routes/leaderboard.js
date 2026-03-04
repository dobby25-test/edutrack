const express = require('express');
const router = express.Router();
const { getLeaderboard, getMyRank } = require('../controllers/leaderboardcontroller');
const { authenticateToken } = require('../middleware/auth');

// Get leaderboard
router.get('/', authenticateToken, getLeaderboard);

// Get my rank
router.get('/my-rank', authenticateToken, getMyRank);

module.exports = router;
