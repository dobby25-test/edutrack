const { Project, Assignment, User, Submission } = require('../models');
const { Op } = require('sequelize');
const { checkAndAwardAutomaticBadges } = require('./badgeController');

const { sendAssignmentNotification, sendGradeNotification } = require('../services/emailService');
const JDOODLE_EXECUTE_URL = 'https://api.jdoodle.com/v1/execute';
const JDOODLE_CREDIT_URL = 'https://api.jdoodle.com/v1/credit-spent';

const JDOODLE_LANGUAGE_MAP = {
  java: { language: 'java', versionIndex: '4' },
  python: { language: 'python3', versionIndex: '4' },
  javascript: { language: 'nodejs', versionIndex: '4' },
  cpp: { language: 'cpp17', versionIndex: '1' },
  c: { language: 'c', versionIndex: '5' },
  php: { language: 'php', versionIndex: '4' },
  ruby: { language: 'ruby', versionIndex: '4' },
  go: { language: 'go', versionIndex: '4' },
  rust: { language: 'rust', versionIndex: '4' },
  kotlin: { language: 'kotlin', versionIndex: '3' },
  swift: { language: 'swift', versionIndex: '4' },
  sql: { language: 'sql', versionIndex: '4' }
};
const SUPPORTED_SUBMISSION_LANGUAGES = new Set([
  ...Object.keys(JDOODLE_LANGUAGE_MAP),
  'html'
]);

const getJdoodleCredentials = () => {
  const clientId = process.env.JDOODLE_CLIENT_ID || process.env.VITE_JDOODLE_CLIENT_ID || '';
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET || process.env.VITE_JDOODLE_CLIENT_SECRET || '';
  return { clientId, clientSecret };
};

const createProject = async (req, res) => {
  try {
    const { title, description, requirements, dueDate, maxMarks, subject } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and due date are required'
      });
    }

    const project = await Project.create({
      teacherId: req.user.id,
      title,
      description,
      requirements,
      dueDate,
      maxMarks: maxMarks || 100,
      subject,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
};

const assignProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student IDs array'
      });
    }

    const project = await Project.findOne({
      where: {
        id: projectId,
        teacherId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or unauthorized'
      });
    }

    const normalizedIds = [...new Set(studentIds.map((id) => Number(id)).filter(Boolean))];

    if (normalizedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid student IDs'
      });
    }

    const validStudents = await User.findAll({
      where: {
        id: { [Op.in]: normalizedIds },
        role: 'student',
        isActive: true
      },
      attributes: ['id']
    });

    const validStudentIds = validStudents.map((student) => student.id);

    if (validStudentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid active students found for assignment'
      });
    }

    const existingAssignments = await Assignment.findAll({
      where: {
        projectId: project.id,
        studentId: { [Op.in]: validStudentIds }
      },
      attributes: ['studentId']
    });

    const existingStudentIds = new Set(existingAssignments.map((assignment) => assignment.studentId));
    const newStudentIds = validStudentIds.filter((studentId) => !existingStudentIds.has(studentId));

    if (newStudentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All selected students are already assigned to this project',
        assignedCount: 0,
        skippedCount: validStudentIds.length
      });
    }

    const assignments = await Assignment.bulkCreate(
      newStudentIds.map((studentId) => ({
        projectId: project.id,
        studentId,
        status: 'assigned'
      }))
    );

    const teacher = await User.findByPk(req.user.id);
    const assignedStudents = await User.findAll({
      where: { id: { [Op.in]: newStudentIds } },
      attributes: ['id', 'name', 'email']
    });

    if (teacher) {
      assignedStudents.forEach((student) => {
        sendAssignmentNotification(student, project, teacher).catch((err) => {
          console.error('Failed to send assignment notification:', err.message);
        });
      });
    }

    res.json({
      success: true,
      message: `Project assigned to ${assignments.length} students`,
      assignedCount: assignments.length,
      skippedCount: validStudentIds.length - assignments.length
    });
  } catch (error) {
    console.error('Assign project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign project',
      error: error.message
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { teacherId: req.user.id },
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            },
            {
              model: Submission,
              as: 'submission'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const projectsWithStats = projects.map((project) => {
      const total = project.assignments.length;
      const submitted = project.assignments.filter((a) => a.status === 'submitted' || a.status === 'graded').length;
      const graded = project.assignments.filter((a) => a.status === 'graded').length;

      return {
        ...project.toJSON(),
        stats: {
          totalStudents: total,
          submitted,
          graded,
          pending: total - submitted
        }
      };
    });

    res.json({
      success: true,
      count: projects.length,
      projects: projectsWithStats
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};

const getProjectSubmissions = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      where: {
        id: projectId,
        teacherId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or unauthorized'
      });
    }

    const assignments = await Assignment.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: Submission,
          as: 'submission'
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        dueDate: project.dueDate,
        maxMarks: project.maxMarks
      },
      submissions: assignments
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, teacherFeedback } = req.body;

    if (marks === undefined || marks < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid marks are required'
      });
    }

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [
            { model: Project, as: 'project' },
            { model: User, as: 'student' }
          ]
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check teacher owns this project
    if (submission.assignment.project.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to grade this submission'
      });
    }

    if (marks > submission.assignment.project.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed ${submission.assignment.project.maxMarks}`
      });
    }

    await submission.update({
      marks,
      teacherFeedback: teacherFeedback ?? feedback ?? null,
      status: 'graded',
    });

    await Assignment.update(
      {
        status: 'graded',
        gradedAt: new Date()
      },
      { where: { id: submission.assignmentId } }
    );

    // ── CHECK AND AWARD AUTOMATIC BADGES ──
    const badgesAwarded = await checkAndAwardAutomaticBadges(
      submission,
      submission.assignment
    );



    // ── SEND GRADE NOTIFICATION ────────────────────────────────────────
    const student = submission.assignment.student;
    const project = submission.assignment.project;
    
    if (student && project) {
      sendGradeNotification(student, project, submission).catch(err => {
        console.error('Failed to send grade notification:', err.message);
      });
    }
// Send grade notification email
    // ... existing email code ...

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission,
      badgesAwarded, // Return badges that were awarded
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to grade submission' });
  }
};


const getTeacherStats = async (req, res) => {
  try {
    const totalProjects = await Project.count({
      where: { teacherId: req.user.id }
    });

    const totalAssignments = await Assignment.count({
      include: [{
        model: Project,
        as: 'project',
        where: { teacherId: req.user.id }
      }]
    });

    const pendingReviews = await Assignment.count({
      where: { status: 'submitted' },
      include: [{
        model: Project,
        as: 'project',
        where: { teacherId: req.user.id }
      }]
    });

    const gradedCount = await Assignment.count({
      where: { status: 'graded' },
      include: [{
        model: Project,
        as: 'project',
        where: { teacherId: req.user.id }
      }]
    });

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalStudents: totalAssignments,
        pendingReviews,
        graded: gradedCount,
        averageGrade: 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

const getStudentAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['id', 'name', 'email', 'department']
            }
          ]
        },
        {
          model: Submission,
          as: 'submission'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { codeContent, studentComments, language } = req.body;

    const normalizedContent = typeof codeContent === 'string' ? codeContent.trim() : '';
    const normalizedComments = typeof studentComments === 'string' ? studentComments.trim() : '';
    const normalizedLanguage = typeof language === 'string' ? language.trim().toLowerCase() : '';
    const safeLanguage = SUPPORTED_SUBMISSION_LANGUAGES.has(normalizedLanguage)
      ? normalizedLanguage
      : null;

    if (!normalizedContent) {
      return res.status(400).json({
        success: false,
        message: 'Assignment answer is required'
      });
    }

    const assignment = await Assignment.findOne({
      where: {
        id: assignmentId,
        studentId: req.user.id
      },
      include: [
        {
          model: Submission,
          as: 'submission'
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.status === 'graded') {
      return res.status(400).json({
        success: false,
        message: 'This assignment has already been graded and cannot be edited'
      });
    }

    let submission = assignment.submission;
    const payload = {
      codeContent: normalizedContent,
      studentComments: normalizedComments || null,
      language: safeLanguage || submission?.language || null,
      status: 'submitted'
    };

    if (submission) {
      submission = await submission.update(payload);
    } else {
      submission = await Submission.create({
        assignmentId: assignment.id,
        ...payload
      });
    }

    await assignment.update({
      status: 'submitted',
      submittedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      error: error.message
    });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: Assignment,
          as: 'assignments',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
};


// ── 1. Add to backend/controllers/projectController.js ──────────────────

/**
 * @route   GET /api/projects/director/stats
 * @desc    Aggregate stats for the director overview
 * @access  Private (Director)
 */
const getDirectorStats = async (req, res) => {
  try {
    const totalProjects  = await Project.count();
    const totalTeachers  = await User.count({ where: { role: 'teacher', isActive: true } });
    const totalStudents  = await User.count({ where: { role: 'student', isActive: true } });
    const pendingReviews = await Assignment.count({ where: { status: 'submitted' } });
    const totalGraded    = await Assignment.count({ where: { status: 'graded' } });
    const totalAssigned  = await Assignment.count();

    res.json({
      success: true,
      totalProjects,
      totalTeachers,
      totalStudents,
      pendingReviews,
      totalGraded,
      totalAssigned,
    });
  } catch (error) {
    console.error('Director stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Update getAllProjects to include more aggregated info
// Replace the existing getAllProjects in projectController.js:

const getAllProjectsEnhanced = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'department'],
        },
        {
          model: Assignment,
          as: 'assignments',
          include: [
            { model: Submission, as: 'submission', required: false },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = projects.map((p) => {
      const assignments = p.assignments || [];
      return {
        id:           p.id,
        title:        p.title,
        subject:      p.subject,
        description:  p.description,
        status:       p.status,
        dueDate:      p.dueDate,
        maxMarks:     p.maxMarks,
        teacherId:    p.teacherId,
        teacherName:  p.teacher?.name,
        teacherEmail: p.teacher?.email,
        department:   p.teacher?.department,
        createdAt:    p.createdAt,

        // Aggregated stats
        totalStudents: assignments.length,
        submitted:     assignments.filter(a => a.status === 'submitted').length,
        graded:        assignments.filter(a => a.status === 'graded').length,
        pending:       assignments.filter(a => ['assigned','in_progress'].includes(a.status)).length,
      };
    });

    res.json({ success: true, count: result.length, projects: result });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};




const executeCode = async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body || {};
    const trimmedCode = typeof code === 'string' ? code.trim() : '';
    const selectedLanguage = typeof language === 'string' ? language.trim().toLowerCase() : '';

    if (!trimmedCode) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const langConfig = JDOODLE_LANGUAGE_MAP[selectedLanguage];
    if (!langConfig) {
      return res.status(400).json({
        success: false,
        message: `Language '${selectedLanguage}' is not runnable`
      });
    }

    const { clientId, clientSecret } = getJdoodleCredentials();
    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'JDoodle credentials missing on backend. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in backend/.env'
      });
    }

    const response = await fetch(JDOODLE_EXECUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script: trimmedCode,
        stdin: typeof stdin === 'string' ? stdin : '',
        language: langConfig.language,
        versionIndex: langConfig.versionIndex
      })
    });

    const rawBody = await response.text();
    let data = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (_err) {
      data = { output: rawBody };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.error || data.output || 'JDoodle execution failed',
        details: data
      });
    }

    const statusCode = data.statusCode ?? 1;
    const success = statusCode === 200;

    return res.json({
      success,
      output: data.output || '',
      error: success ? '' : (data.output || data.error || 'Execution failed'),
      memory: data.memory ?? null,
      cpuTime: data.cpuTime ?? null,
      statusCode
    });
  } catch (error) {
    console.error('Execute code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute code',
      error: error.message
    });
  }
};

const getExecutionCredits = async (_req, res) => {
  try {
    const { clientId, clientSecret } = getJdoodleCredentials();
    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'JDoodle credentials missing on backend',
        used: 0
      });
    }

    const response = await fetch(JDOODLE_CREDIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });

    const rawBody = await response.text();
    let data = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (_err) {
      data = { used: 0 };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: 'Failed to fetch JDoodle credits',
        used: Number(data.used) || 0
      });
    }

    return res.json({
      success: true,
      used: Number(data.used) || 0
    });
  } catch (error) {
    console.error('Get execution credits error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch execution credits',
      used: 0
    });
  }
};

module.exports = {
  createProject,
  assignProject,
  getMyProjects,
  getProjectSubmissions,
  gradeSubmission,
  getTeacherStats,
  getStudentAssignments,
  submitAssignment,
  getAllProjectsEnhanced,
  getDirectorStats,
  executeCode,
  getExecutionCredits
};
