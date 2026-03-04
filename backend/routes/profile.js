
const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  uploadPhoto,
  removePhoto,
  getUserProfile,
} = require('../controllers/profilecontrollers');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get my profile
router.get('/me', authenticateToken, getMyProfile);

// Upload photo
router.post('/upload-photo', authenticateToken, uploadPhoto);

// Remove photo
router.delete('/remove-photo', authenticateToken, removePhoto);

// Get any user's profile (Teacher/Director only)
router.get(
  '/user/:userId',
  authenticateToken,
  checkRole('teacher', 'director'),
  getUserProfile
);

module.exports = router;
