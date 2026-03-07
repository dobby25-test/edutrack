
const User = require('../models/User');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Badge = require('../models/Badge');
const { Op } = require('sequelize');

/**
 * @route   GET /api/analytics/student/:studentId
 * @desc    Get detailed analytics for a student
 * @access  Private (Student/Teacher/Director)
 */
const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const targetStudentId = Number(studentId);

    if (!Number.isInteger(targetStudentId) || targetStudentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }

    if (req.user.role === 'student' && req.user.id !== targetStudentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.user.role === 'teacher') {
      const assignmentCount = await Assignment.count({
        where: { studentId: targetStudentId },
        include: [
          {
            model: Project,
            as: 'project',
            where: { teacherId: req.user.id },
            required: true
          }
        ]
      });

      if (assignmentCount === 0) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Get student
    const student = await User.findByPk(targetStudentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all assignments
    const assignments = await Assignment.findAll({
      where: { studentId: targetStudentId },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'subject', 'maxMarks', 'dueDate'],
        },
        {
          model: Submission,
          as: 'submission',
          attributes: ['id', 'marks', 'submittedAt', 'status'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Performance over time (last 10 submissions)
    const gradedAssignments = assignments
      .filter(a => a.submission && a.submission.marks !== null)
      .slice(-10);

    const performanceOverTime = gradedAssignments.map(a => ({
      date: a.submission.submittedAt,
      score: Math.round((a.submission.marks / a.project.maxMarks) * 100),
      title: a.project.title,
    }));

    // Subject-wise performance
    const subjectPerformance = {};
    assignments.forEach(a => {
      if (a.submission && a.submission.marks !== null) {
        const subject = a.project.subject || 'Other';
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { total: 0, count: 0, maxMarks: 0 };
        }
        subjectPerformance[subject].total += a.submission.marks;
        subjectPerformance[subject].maxMarks += a.project.maxMarks;
        subjectPerformance[subject].count++;
      }
    });

    const subjectStats = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: Math.round((data.total / data.maxMarks) * 100),
      count: data.count,
    }));

    // Submission patterns (on-time vs late)
    const submissionPatterns = {
      onTime: 0,
      late: 0,
      pending: 0,
    };

    assignments.forEach(a => {
      if (!a.submission) {
        submissionPatterns.pending++;
      } else if (a.project.dueDate) {
        const submitted = new Date(a.submission.submittedAt);
        const due = new Date(a.project.dueDate);
        if (submitted <= due) {
          submissionPatterns.onTime++;
        } else {
          submissionPatterns.late++;
        }
      }
    });

    // Grade distribution
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradedAssignments.forEach(a => {
      const percentage = (a.submission.marks / a.project.maxMarks) * 100;
      if (percentage >= 90) gradeDistribution.A++;
      else if (percentage >= 75) gradeDistribution.B++;
      else if (percentage >= 60) gradeDistribution.C++;
      else if (percentage >= 50) gradeDistribution.D++;
      else gradeDistribution.F++;
    });

    // Badges earned over time
    const badges = await Badge.findAll({
      where: { userId: targetStudentId },
      order: [['awardedAt', 'ASC']],
    });

    const badgesOverTime = {};
    badges.forEach(b => {
      const month = new Date(b.awardedAt).toLocaleDateString('en', { month: 'short', year: 'numeric' });
      badgesOverTime[month] = (badgesOverTime[month] || 0) + 1;
    });

    // Strengths & weaknesses
    const sortedSubjects = subjectStats.sort((a, b) => b.average - a.average);
    const strengths = sortedSubjects.slice(0, 2).map(s => s.subject);
    const weaknesses = sortedSubjects.slice(-2).map(s => s.subject);

    // Overall stats
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.submission).length;
    const averageScore = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.submission.marks / a.project.maxMarks) * 100, 0) / gradedAssignments.length)
      : 0;

    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        course: student.course,
        section: student.section,
      },
      stats: {
        totalAssignments,
        completedAssignments,
        averageScore,
        totalBadges: badges.length,
      },
      charts: {
        performanceOverTime,
        subjectPerformance: subjectStats,
        submissionPatterns,
        gradeDistribution,
        badgesOverTime: Object.entries(badgesOverTime).map(([month, count]) => ({ month, count })),
      },
      insights: {
        strengths,
        weaknesses,
        submissionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
        onTimeRate: (submissionPatterns.onTime + submissionPatterns.late) > 0
          ? Math.round((submissionPatterns.onTime / (submissionPatterns.onTime + submissionPatterns.late)) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

/**
 * @route   GET /api/analytics/teacher/:teacherId
 * @desc    Get analytics for a teacher's classes
 * @access  Private (Teacher/Director)
 */
const getTeacherAnalytics = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const targetTeacherId = Number(teacherId);

    if (!Number.isInteger(targetTeacherId) || targetTeacherId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid teacher id' });
    }

    if (req.user.role === 'teacher' && req.user.id !== targetTeacherId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all projects by teacher
    const projects = await Project.findAll({
      where: { teacherId: targetTeacherId },
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [{ model: Submission, as: 'submission' }],
        },
      ],
    });

    const totalProjects = projects.length;
    const totalAssignments = projects.reduce((sum, p) => sum + p.assignments.length, 0);
    const submittedAssignments = projects.reduce(
      (sum, p) => sum + p.assignments.filter(a => a.submission).length,
      0
    );

    const submissionRate = totalAssignments > 0
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;

    // Average score across all students
    const gradedSubmissions = projects
      .flatMap(p => p.assignments)
      .filter(a => a.submission && a.submission.marks !== null);

    const averageScore = gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum, a) => {
            const project = projects.find(p => p.id === a.projectId);
            return sum + (a.submission.marks / project.maxMarks) * 100;
          }, 0) / gradedSubmissions.length
        )
      : 0;

    // Top performers
    const studentPerformance = {};
    projects.forEach(p => {
      p.assignments.forEach(a => {
        if (a.submission && a.submission.marks !== null) {
          if (!studentPerformance[a.studentId]) {
            studentPerformance[a.studentId] = { total: 0, count: 0, maxMarks: 0 };
          }
          studentPerformance[a.studentId].total += a.submission.marks;
          studentPerformance[a.studentId].maxMarks += p.maxMarks;
          studentPerformance[a.studentId].count++;
        }
      });
    });

    const topPerformers = await Promise.all(
      Object.entries(studentPerformance)
        .sort((a, b) => (b[1].total / b[1].maxMarks) - (a[1].total / a[1].maxMarks))
        .slice(0, 5)
        .map(async ([studentId, data]) => {
          const student = await User.findByPk(studentId, { attributes: ['id', 'name', 'rollNo'] });
          return {
            ...student.toJSON(),
            average: Math.round((data.total / data.maxMarks) * 100),
            assignmentsCompleted: data.count,
          };
        })
    );

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalAssignments,
        submissionRate,
        averageScore,
      },
      topPerformers,
    });
  } catch (error) {
    console.error('Get teacher analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

/**
 * @route   GET /api/analytics/director
 * @desc    Get institution-wide analytics
 * @access  Private (Director)
 */
const getDirectorAnalytics = async (req, res) => {
  try {
    // Overall counts
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalTeachers = await User.count({ where: { role: 'teacher' } });
    const totalProjects = await Project.count();
    const totalAssignments = await Assignment.count();

    // Department-wise breakdown
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['department'],
    });

    const departmentCounts = {};
    students.forEach(s => {
      const dept = s.department || 'Other';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const departmentStats = Object.entries(departmentCounts).map(([dept, count]) => ({
      department: dept,
      students: count,
    }));

    // Course-wise breakdown
    const courseCounts = {};
    students.forEach(s => {
      const course = s.course || 'Other';
      courseCounts[course] = (courseCounts[course] || 0) + 1;
    });

    const courseStats = Object.entries(courseCounts).map(([course, count]) => ({
      course,
      students: count,
    }));

    // Growth over time (students per month for last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentStudents = await User.findAll({
      where: {
        role: 'student',
        createdAt: { [Op.gte]: sixMonthsAgo },
      },
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']],
    });

    const growthData = {};
    recentStudents.forEach(s => {
      const month = new Date(s.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' });
      growthData[month] = (growthData[month] || 0) + 1;
    });

    const growthOverTime = Object.entries(growthData).map(([month, count]) => ({ month, count }));

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalProjects,
        totalAssignments,
      },
      charts: {
        departmentStats,
        courseStats,
        growthOverTime,
      },
    });
  } catch (error) {
    console.error('Get director analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

module.exports = {
  getStudentAnalytics,
  getTeacherAnalytics,
  getDirectorAnalytics,
};


