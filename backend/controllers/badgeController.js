const Badge = require('../models/Badge');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// Badge definitions
const BADGE_DEFINITIONS = {
  early_bird: { name: 'Early Bird', icon: '\ud83d\udc26', description: 'Submitted 2+ hours before deadline' },
  perfect_score: { name: 'Perfect Score', icon: '\u2b50', description: 'Achieved 100% marks' },
  first_blood: { name: 'First Blood', icon: '\ud83e\udd47', description: 'First submission in class' },
  streak_master: { name: 'Streak Master', icon: '\ud83d\udd25', description: '10 consecutive submissions' },
  night_owl: { name: 'Night Owl', icon: '\ud83e\udd89', description: 'Submitted between 10PM-6AM' },
  quick_learner: { name: 'Quick Learner', icon: '\u26a1', description: 'Submitted within 24 hours' },
  outstanding_work: { name: 'Outstanding Work', icon: '\ud83c\udfc6', description: 'Exceptional quality' },
  creative_genius: { name: 'Creative Genius', icon: '\ud83c\udfa8', description: 'Innovative approach' },
  code_champion: { name: 'Code Champion', icon: '\ud83d\udc68\u200d\ud83d\udcbb', description: 'Clean, efficient code' },
  problem_solver: { name: 'Problem Solver', icon: '\ud83e\udde9', description: 'Tackled difficult challenge' },
  most_improved: { name: 'Most Improved', icon: '\ud83d\ude80', description: 'Significant progress' },
  bronze_tier: { name: 'Bronze', icon: '\ud83e\udd49', description: '10 assignments completed' },
  silver_tier: { name: 'Silver', icon: '\ud83e\udd48', description: '25 assignments completed' },
  gold_tier: { name: 'Gold', icon: '\ud83e\udd47', description: '50 assignments completed' },
};

/**
 * @route   POST /api/badges/award
 * @desc    Award badge to student (Teacher only)
 * @access  Private (Teacher)
 */
const awardBadge = async (req, res) => {
  try {
    const { studentId, type, projectId } = req.body;

    if (!studentId || !type) {
      return res.status(400).json({ success: false, message: 'Student ID and badge type required' });
    }

    const badgeDef = BADGE_DEFINITIONS[type];
    if (!badgeDef) {
      return res.status(400).json({ success: false, message: 'Invalid badge type' });
    }

    // Check if student exists
    const student = await User.findByPk(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Create badge
    const badge = await Badge.create({
      userId: studentId,
      type,
      name: badgeDef.name,
      description: badgeDef.description,
      icon: badgeDef.icon,
      awardedBy: req.user.id,
      projectId: projectId || null,
      isAutomatic: false,
    });

    res.json({
      success: true,
      message: `Badge "${badgeDef.name}" awarded to ${student.name}`,
      badge,
    });
  } catch (error) {
    console.error('Award badge error:', error);
    res.status(500).json({ success: false, message: 'Failed to award badge' });
  }
};

/**
 * @route   GET /api/badges/my-badges
 * @desc    Get all badges for current user
 * @access  Private
 */
const getMyBadges = async (req, res) => {
  try {
    const badges = await Badge.findAll({
      where: { userId: req.user.id },
      order: [['awardedAt', 'DESC']],
      include: [
        { model: User, as: 'awardedByUser', attributes: ['id', 'name'] },
      ],
    });

    const badgeCounts = {};
    badges.forEach((badge) => {
      badgeCounts[badge.type] = (badgeCounts[badge.type] || 0) + 1;
    });

    res.json({
      success: true,
      badges,
      badgeCounts,
      total: badges.length,
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch badges' });
  }
};

/**
 * Check and award automatic badges after submission.
 * It avoids creating duplicate badges for the same rule context.
 */
const checkAndAwardAutomaticBadges = async (submission, assignment) => {
  try {
    const studentId = assignment.studentId;
    const candidates = [];

    // Perfect Score
    if (submission.marks === assignment.project.maxMarks) {
      candidates.push({
        userId: studentId,
        type: 'perfect_score',
        ...BADGE_DEFINITIONS.perfect_score,
        projectId: assignment.projectId,
      });
    }

    // Early Bird (submitted 2+ hours before deadline)
    if (assignment.project.dueDate) {
      const submittedAt = new Date(submission.submittedAt);
      const dueDate = new Date(assignment.project.dueDate);
      const hoursBefore = (dueDate - submittedAt) / (1000 * 60 * 60);
      if (hoursBefore >= 2) {
        candidates.push({
          userId: studentId,
          type: 'early_bird',
          ...BADGE_DEFINITIONS.early_bird,
          projectId: assignment.projectId,
        });
      }
    }

    // Night Owl (submitted between 10PM and 6AM)
    const hour = new Date(submission.submittedAt).getHours();
    if (hour >= 22 || hour < 6) {
      candidates.push({
        userId: studentId,
        type: 'night_owl',
        ...BADGE_DEFINITIONS.night_owl,
        projectId: assignment.projectId,
      });
    }

    // Milestone badges
    const totalCompleted = await Submission.count({
      include: [{
        model: Assignment,
        as: 'assignment',
        where: { studentId },
      }],
    });

    if (totalCompleted === 10) {
      candidates.push({ userId: studentId, type: 'bronze_tier', ...BADGE_DEFINITIONS.bronze_tier });
    } else if (totalCompleted === 25) {
      candidates.push({ userId: studentId, type: 'silver_tier', ...BADGE_DEFINITIONS.silver_tier });
    } else if (totalCompleted === 50) {
      candidates.push({ userId: studentId, type: 'gold_tier', ...BADGE_DEFINITIONS.gold_tier });
    }

    const awardedBadges = [];

    for (const candidate of candidates) {
      const where = {
        userId: candidate.userId,
        type: candidate.type,
      };

      if (candidate.projectId) {
        where.projectId = candidate.projectId;
      }

      const existing = await Badge.findOne({ where });
      if (existing) continue;

      const created = await Badge.create(candidate);
      awardedBadges.push(created);
    }

    return awardedBadges;
  } catch (error) {
    console.error('Check automatic badges error:', error);
    return [];
  }
};

module.exports = {
  awardBadge,
  getMyBadges,
  checkAndAwardAutomaticBadges,
  BADGE_DEFINITIONS,
};
