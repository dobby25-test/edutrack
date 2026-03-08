const express = require('express');
const router = express.Router();

const {
  register,
  createUserByDirector,
  login,
  getMe,
  getAllStudents,
  getAllUsers,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
  verifyAccessCode,
  registerDirector,
  updateUser,
  deleteUser
} = require('../controllers/authController');

const { authenticateToken, checkRole } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);
router.post('/verify-access-code', verifyAccessCode);
router.post('/register-director', registerDirector);

router.post('/create-user', authenticateToken, checkRole('director'), createUserByDirector);
router.put('/users/:userId', authenticateToken, checkRole('director'), updateUser);
router.delete('/users/:userId', authenticateToken, checkRole('director'), deleteUser);
router.get('/me', authenticateToken, getMe);
router.get('/students', authenticateToken, checkRole('teacher', 'director'), getAllStudents);
router.get('/all-users', authenticateToken, checkRole('director'), getAllUsers);

module.exports = router;
