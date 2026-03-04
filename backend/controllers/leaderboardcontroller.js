const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Project = require('../models/Project');
const Badge = require('../models/Badge');
const { Op } = require('sequelize');

const computeStudentPoints = (assignmentRows = [], badgeCount = 0) => {
  const gradedAssignments = assignmentRows.filter((a) => (
    a?.submission && a.submission.marks !== null && Number(a?.project?.maxMarks) > 0
  ));

  let averageScore = 0;
  if (gradedAssignments.length > 0) {
    const totalPercentage = gradedAssignments.reduce((sum, a) => (
      sum + ((Number(a.submission.marks) / Number(a.project.maxMarks)) * 100)
    ), 0);
    averageScore = Math.round(totalPercentage / gradedAssignments.length);
  }

  const points = averageScore * gradedAssignments.length + badgeCount * 10;
  return { averageScore, assignments: gradedAssignments.length, points };
};

/**
 * @route   GET /api/leaderboard
 * @desc    Get leaderboard of top students
 * @access  Private
 * @query   course, section, limit
 */
const getLeaderboard = async (req, res) => {
  try {
    const { course, section, limit = 50 } = req.query;

    const whereClause = { role: 'student' };
    if (course) whereClause.course = course;
    if (section) whereClause.section = section;

    const students = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'rollNo', 'course', 'section', 'profilePhoto'],
    });

    if (students.length === 0) {
      return res.json({
        success: true,
        leaderboard: [],
        filters: { course, section },
      });
    }

    const studentIds = students.map((s) => s.id);
    const [assignments, badgeCounts] = await Promise.all([
      Assignment.findAll({
        where: { studentId: { [Op.in]: studentIds } },
        attributes: ['id', 'studentId'],
        include: [
          { model: Project, as: 'project', attributes: ['maxMarks'] },
          { model: Submission, as: 'submission', attributes: ['marks'] },
        ],
      }),
      Badge.findAll({
        where: { userId: { [Op.in]: studentIds } },
        attributes: ['userId'],
      })
    ]);

    const assignmentsByStudent = new Map();
    assignments.forEach((row) => {
      const key = row.studentId;
      const bucket = assignmentsByStudent.get(key) || [];
      bucket.push(row);
      assignmentsByStudent.set(key, bucket);
    });

    const badgesByStudent = new Map();
    badgeCounts.forEach((row) => {
      const key = row.userId;
      badgesByStudent.set(key, (badgesByStudent.get(key) || 0) + 1);
    });

    const leaderboardData = students.map((student) => {
      const studentAssignments = assignmentsByStudent.get(student.id) || [];
      const badgeCount = badgesByStudent.get(student.id) || 0;
      const stats = computeStudentPoints(studentAssignments, badgeCount);

      return {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        course: student.course,
        section: student.section,
        profilePhoto: student.profilePhoto,
        averageScore: stats.averageScore,
        assignments: stats.assignments,
        badges: badgeCount,
        points: stats.points,
      };
    });

    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

    const leaderboard = leaderboardData
      .sort((a, b) => b.points - a.points)
      .slice(0, safeLimit);

    res.json({
      success: true,
      leaderboard,
      filters: { course, section },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

/**
 * @route   GET /api/leaderboard/my-rank
 * @desc    Get current user's rank
 * @access  Private (Student)
 */
const getMyRank = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || user.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Only students have ranks' });
    }

    const students = await User.findAll({
      where: { role: 'student', course: user.course },
      attributes: ['id'],
    });

    if (students.length === 0) {
      return res.json({
        success: true,
        rank: null,
        totalStudents: 0,
        percentile: 0,
      });
    }

    const studentIds = students.map((s) => s.id);
    const [assignments, badges] = await Promise.all([
      Assignment.findAll({
        where: { studentId: { [Op.in]: studentIds } },
        attributes: ['id', 'studentId'],
        include: [
          { model: Project, as: 'project', attributes: ['maxMarks'] },
          { model: Submission, as: 'submission', attributes: ['marks'] },
        ],
      }),
      Badge.findAll({
        where: { userId: { [Op.in]: studentIds } },
        attributes: ['userId'],
      })
    ]);

    const assignmentsByStudent = new Map();
    assignments.forEach((row) => {
      const key = row.studentId;
      const bucket = assignmentsByStudent.get(key) || [];
      bucket.push(row);
      assignmentsByStudent.set(key, bucket);
    });

    const badgesByStudent = new Map();
    badges.forEach((row) => {
      const key = row.userId;
      badgesByStudent.set(key, (badgesByStudent.get(key) || 0) + 1);
    });

    const allPoints = studentIds.map((studentId) => {
      const stats = computeStudentPoints(
        assignmentsByStudent.get(studentId) || [],
        badgesByStudent.get(studentId) || 0
      );
      return { id: studentId, points: stats.points };
    });

    const sorted = allPoints.sort((a, b) => b.points - a.points);
    const myRank = sorted.findIndex((s) => s.id === userId) + 1;
    const totalStudents = sorted.length;

    if (totalStudents === 0 || myRank === 0) {
      return res.json({
        success: true,
        rank: null,
        totalStudents,
        percentile: 0,
      });
    }

    res.json({
      success: true,
      rank: myRank,
      totalStudents,
      percentile: Math.round((1 - myRank / totalStudents) * 100),
    });
  } catch (error) {
    console.error('Get my rank error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rank' });
  }
};

module.exports = {
  getLeaderboard,
  getMyRank,
};
