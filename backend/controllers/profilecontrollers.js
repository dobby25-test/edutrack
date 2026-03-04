
const User = require('../models/User');
const Badge = require('../models/Badge');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Project = require('../models/Project');
const { Op } = require('sequelize');

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const extractPhotoMetaFromDataUrl = (value) => {
  if (typeof value !== 'string') return { valid: false };
  const trimmed = value.trim();
  const match = trimmed.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { valid: false };
  const mimeType = match[1];
  const base64Body = match[2];
  const bytes = Math.floor((base64Body.length * 3) / 4) - (base64Body.endsWith('==') ? 2 : base64Body.endsWith('=') ? 1 : 0);
  return { valid: true, mimeType, bytes, value: trimmed };
};

/**
 * @route   GET /api/profile/me
 * @desc    Get current user's profile with stats
 * @access  Private
 */
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetToken', 'resetExpires'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get badges
    const badges = await Badge.findAll({
      where: { userId: user.id },
      order: [['awardedAt', 'DESC']],
    });

    // Calculate stats based on role
    let stats = {};

    if (user.role === 'student') {
      const assignments = await Assignment.findAll({
        where: { studentId: user.id },
        include: [
          { model: Submission, as: 'submission' },
          { model: Project, as: 'project', attributes: ['id', 'maxMarks'] }
        ],
      });

      const completed = assignments.filter((a) => a.status === 'graded').length;
      const pending = assignments.filter((a) => a.status !== 'graded').length;

      const gradedSubmissions = assignments.filter((a) => (
        a.status === 'graded' &&
        a.submission &&
        a.submission.marks !== null &&
        a.project &&
        Number(a.project.maxMarks) > 0
      ));
      const avgScore = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, a) => {
          const scorePercent = ((Number(a.submission.marks) || 0) / Number(a.project.maxMarks)) * 100;
          return sum + Math.max(0, Math.min(100, scorePercent));
        }, 0) / gradedSubmissions.length)
        : 0;

      stats = {
        totalAssignments: assignments.length,
        completed,
        pending,
        averageScore: avgScore,
        badgeCount: badges.length,
      };
    }

    if (user.role === 'teacher') {
      const projects = await Project.findAll({ where: { teacherId: user.id } });
      const assignments = await Assignment.findAll({
        include: [{ model: Project, as: 'project', where: { teacherId: user.id } }],
      });
      const students = [...new Set(assignments.map(a => a.studentId))].length;

      stats = {
        totalProjects: projects.length,
        totalAssignments: assignments.length,
        studentsTeaching: students,
      };
    }

    if (user.role === 'director') {
      const [totalProjects, totalTeachers, totalStudents, pendingReviews] = await Promise.all([
        Project.count(),
        User.count({ where: { role: 'teacher', isActive: true } }),
        User.count({ where: { role: 'student', isActive: true } }),
        Assignment.count({ where: { status: 'submitted' } }),
      ]);

      stats = {
        totalProjects,
        totalTeachers,
        totalStudents,
        pendingReviews,
        badgeCount: badges.length,
      };
    }

    res.json({
      success: true,
      user,
      badges,
      stats,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/**
 * @route   POST /api/profile/upload-photo
 * @desc    Upload profile photo
 * @access  Private
 */
const uploadPhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body; // Base64 or URL from frontend

    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'Photo data required' });
    }

    const meta = extractPhotoMetaFromDataUrl(photoUrl);
    if (!meta.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo format. Use JPG, PNG, or WebP data URL.'
      });
    }

    if (!ALLOWED_PHOTO_MIME_TYPES.has(meta.mimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, PNG, and WebP images are allowed.'
      });
    }

    if (meta.bytes > MAX_PHOTO_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'Photo must be 5MB or smaller.'
      });
    }

    await User.update(
      { profilePhoto: meta.value },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Profile photo updated',
      photoUrl: meta.value,
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload photo' });
  }
};

/**
 * @route   DELETE /api/profile/remove-photo
 * @desc    Remove profile photo
 * @access  Private
 */
const removePhoto = async (req, res) => {
  try {
    await User.update(
      { profilePhoto: null },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Profile photo removed',
    });
  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove photo' });
  }
};

/**
 * @route   GET /api/profile/user/:userId
 * @desc    Get any user's profile (for teachers/directors)
 * @access  Private (Teacher/Director)
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetExpires'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const badges = await Badge.findAll({
      where: { userId: user.id },
      order: [['awardedAt', 'DESC']],
    });

    // Calculate stats
    let stats = {};

    if (user.role === 'student') {
      const assignments = await Assignment.findAll({
        where: { studentId: user.id },
        include: [
          { model: Submission, as: 'submission' },
          { model: Project, as: 'project', attributes: ['id', 'maxMarks'] }
        ],
      });

      const completed = assignments.filter((a) => a.status === 'graded').length;
      const pending = assignments.filter((a) => a.status !== 'graded').length;

      const gradedSubmissions = assignments.filter((a) => (
        a.status === 'graded' &&
        a.submission &&
        a.submission.marks !== null &&
        a.project &&
        Number(a.project.maxMarks) > 0
      ));
      const avgScore = gradedSubmissions.length > 0
        ? Math.round(gradedSubmissions.reduce((sum, a) => {
          const scorePercent = ((Number(a.submission.marks) || 0) / Number(a.project.maxMarks)) * 100;
          return sum + Math.max(0, Math.min(100, scorePercent));
        }, 0) / gradedSubmissions.length)
        : 0;

      stats = {
        totalAssignments: assignments.length,
        completed,
        pending,
        averageScore: avgScore,
        badgeCount: badges.length,
      };
    }

    res.json({
      success: true,
      user,
      badges,
      stats,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

module.exports = {
  getMyProfile,
  uploadPhoto,
  removePhoto,
  getUserProfile,
};
