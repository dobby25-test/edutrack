const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Project = require('../models/Project');
const Badge = require('../models/Badge');

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

    const leaderboardData = await Promise.all(
      students.map(async (student) => {
        const assignments = await Assignment.findAll({
          where: { studentId: student.id },
          include: [
            { model: Project, as: 'project', attributes: ['maxMarks'] },
            { model: Submission, as: 'submission', attributes: ['marks'] },
          ],
        });

        const gradedAssignments = assignments.filter(
          (a) => a.submission && a.submission.marks !== null
        );

        let averageScore = 0;
        if (gradedAssignments.length > 0) {
          const totalPercentage = gradedAssignments.reduce((sum, a) => {
            return sum + (a.submission.marks / a.project.maxMarks) * 100;
          }, 0);
          averageScore = Math.round(totalPercentage / gradedAssignments.length);
        }

        const badgeCount = await Badge.count({ where: { userId: student.id } });
        const points = averageScore * gradedAssignments.length + badgeCount * 10;

        return {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          course: student.course,
          section: student.section,
          profilePhoto: student.profilePhoto,
          averageScore,
          assignments: gradedAssignments.length,
          badges: badgeCount,
          points,
        };
      })
    );

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

    const allPoints = await Promise.all(
      students.map(async (student) => {
        const assignments = await Assignment.findAll({
          where: { studentId: student.id },
          include: [
            { model: Project, as: 'project', attributes: ['maxMarks'] },
            { model: Submission, as: 'submission', attributes: ['marks'] },
          ],
        });

        const gradedAssignments = assignments.filter(
          (a) => a.submission && a.submission.marks !== null
        );

        let averageScore = 0;
        if (gradedAssignments.length > 0) {
          const totalPercentage = gradedAssignments.reduce((sum, a) => {
            return sum + (a.submission.marks / a.project.maxMarks) * 100;
          }, 0);
          averageScore = Math.round(totalPercentage / gradedAssignments.length);
        }

        const badgeCount = await Badge.count({ where: { userId: student.id } });
        const points = averageScore * gradedAssignments.length + badgeCount * 10;

        return { id: student.id, points };
      })
    );

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
