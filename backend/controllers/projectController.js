const { Project, Assignment, User, Submission, ExecutionUsage } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { checkAndAwardAutomaticBadges } = require('./badgeController');
const {
  notifyNewAssignment,
  notifyGrade,
} = require('../services/notificationServices');
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
const STUDENT_DAILY_RUN_LIMIT = Number(process.env.STUDENT_DAILY_RUN_LIMIT) || 5;
const MISSING_COLUMN_RE = /column\s+"?([a-zA-Z0-9_]+)"?\s+of relation\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i;
const MISSING_RELATION_RE = /relation\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i;

const getDbErrorMessage = (error) => String(
  error?.original?.message
  || error?.parent?.message
  || error?.message
  || ''
);

const isMissingColumnError = (error, relationName, columnName) => {
  if (error?.name !== 'SequelizeDatabaseError') return false;
  const msg = getDbErrorMessage(error);
  const match = msg.match(MISSING_COLUMN_RE);
  if (!match) return false;
  const [, missingColumn, missingRelation] = match;
  const relationMatches = !relationName || missingRelation?.toLowerCase() === String(relationName).toLowerCase();
  const columnMatches = !columnName || missingColumn?.toLowerCase() === String(columnName).toLowerCase();
  return relationMatches && columnMatches;
};

const isMissingRelationError = (error, relationName) => {
  if (error?.name !== 'SequelizeDatabaseError') return false;
  const msg = getDbErrorMessage(error);
  const match = msg.match(MISSING_RELATION_RE);
  if (!match) return false;
  const [, missingRelation] = match;
  return !relationName || missingRelation?.toLowerCase() === String(relationName).toLowerCase();
};

const getTodayDateOnly = () => new Date().toISOString().slice(0, 10);
const withDebug = (payload, debugCode) => ({
  ...payload,
  debugCode
});

const consumeStudentExecutionQuota = async (userId) => {
  const usageDate = getTodayDateOnly();
  let usageState = { used: 0, remaining: STUDENT_DAILY_RUN_LIMIT, limit: STUDENT_DAILY_RUN_LIMIT };

  await sequelize.transaction(async (transaction) => {
    const [row] = await ExecutionUsage.findOrCreate({
      where: { userId, usageDate },
      defaults: { userId, usageDate, runCount: 0 },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (row.runCount >= STUDENT_DAILY_RUN_LIMIT) {
      throw Object.assign(new Error(`Run limit reached. Max ${STUDENT_DAILY_RUN_LIMIT} runs per day.`), {
        statusCode: 429,
        used: row.runCount,
        remaining: 0,
        limit: STUDENT_DAILY_RUN_LIMIT
      });
    }

    row.runCount += 1;
    await row.save({ transaction });

    usageState = {
      used: row.runCount,
      remaining: Math.max(STUDENT_DAILY_RUN_LIMIT - row.runCount, 0),
      limit: STUDENT_DAILY_RUN_LIMIT
    };
  });

  return usageState;
};

const getJdoodleCredentials = () => {
  const clientId = process.env.JDOODLE_CLIENT_ID || '';
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET || '';
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
      message: 'An error occurred. Please try again later.'
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

    const newStudentIds = await sequelize.transaction(async (transaction) => {
      const existingAssignments = await Assignment.findAll({
        where: {
          projectId: project.id,
          studentId: { [Op.in]: validStudentIds }
        },
        attributes: ['studentId'],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const existingStudentIds = new Set(existingAssignments.map((assignment) => assignment.studentId));
      const computedNewStudentIds = validStudentIds.filter((studentId) => !existingStudentIds.has(studentId));

      if (computedNewStudentIds.length > 0) {
        await Assignment.bulkCreate(
          computedNewStudentIds.map((studentId) => ({
            projectId: project.id,
            studentId,
            status: 'assigned'
          })),
          {
            transaction,
            ignoreDuplicates: true
          }
        );
      }

      return computedNewStudentIds;
    });

    if (newStudentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All selected students are already assigned to this project',
        assignedCount: 0,
        skippedCount: validStudentIds.length
      });
    }

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
        notifyNewAssignment(student.id, project, teacher).catch((err) => {
          console.error('Failed to create assignment notification:', err.message);
        });
      });
    }

    res.json({
      success: true,
      message: `Project assigned to ${newStudentIds.length} students`,
      assignedCount: newStudentIds.length,
      skippedCount: validStudentIds.length - newStudentIds.length
    });
  } catch (error) {
    console.error('Assign project error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
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
      message: 'An error occurred. Please try again later.'
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
      message: 'An error occurred. Please try again later.'
    });
  }
};

const gradeSubmission = async (req, res) => {
  let stage = 'grade:init';
  try {
    stage = 'grade:parse-input';
    const { submissionId } = req.params;
    const { marks, feedback, teacherFeedback } = req.body;
    const numericMarks = Number(marks);

    if (!Number.isFinite(numericMarks) || numericMarks < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid marks are required'
      });
    }
    stage = 'grade:load-submission';
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

    if (numericMarks > submission.assignment.project.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed ${submission.assignment.project.maxMarks}`
      });
    }

    stage = 'grade:update-submission';
    try {
      await submission.update({
        marks: numericMarks,
        teacherFeedback: teacherFeedback ?? feedback ?? null,
        status: 'graded',
      });
    } catch (error) {
      if (isMissingColumnError(error, 'submissions', 'teacherFeedback')) {
        await submission.update({
          marks: numericMarks,
          status: 'graded'
        });
      } else {
        throw error;
      }
    }

    stage = 'grade:update-assignment';
    try {
      await Assignment.update(
        {
          status: 'graded',
          gradedAt: new Date()
        },
        { where: { id: submission.assignmentId } }
      );
    } catch (error) {
      if (isMissingColumnError(error, 'assignments', 'gradedAt')) {
        await Assignment.update(
          { status: 'graded' },
          { where: { id: submission.assignmentId } }
        );
      } else {
        throw error;
      }
    }

    stage = 'grade:award-badges';
    // -- CHECK AND AWARD AUTOMATIC BADGES --
    const badgesAwarded = await checkAndAwardAutomaticBadges(
      submission,
      submission.assignment
    );



    stage = 'grade:notify-student';
    // -- SEND GRADE NOTIFICATION ----------------------------------------
    const student = submission.assignment.student;
    const project = submission.assignment.project;
    
    if (student && project) {
      sendGradeNotification(student, project, submission).catch(err => {
        console.error('Failed to send grade notification:', err.message);
      });
      notifyGrade(student.id, project, submission.marks, project.maxMarks).catch((err) => {
        console.error('Failed to create grade notification:', err.message);
      });
    }
// Send grade notification email
    // ... existing email code ...

    stage = 'grade:done';
    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission,
      badgesAwarded, // Return badges that were awarded
    });
  } catch (error) {
    console.error(`[gradeSubmission] stage=${stage}`, error);
    res.status(500).json(withDebug({
      success: false,
      message: 'An error occurred. Please try again later.'
    }, `GRADE_FAIL_${stage}`));
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
      message: 'An error occurred. Please try again later.'
    });
  }
};

const getStudentAssignments = async (req, res) => {
  try {
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
    const offset = (page - 1) * limit;

    const { rows, count } = await Assignment.findAndCountAll({
      where: { studentId: req.user.id },
      attributes: ['id', 'projectId', 'studentId', 'status', 'submittedAt', 'gradedAt', 'createdAt'],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'subject', 'description', 'requirements', 'dueDate', 'maxMarks'],
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
          as: 'submission',
          attributes: ['id', 'assignmentId', 'codeContent', 'language', 'studentComments', 'teacherFeedback', 'marks', 'status', 'createdAt', 'updatedAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      count: rows.length,
      totalCount: count,
      page,
      limit,
      totalPages: Math.max(Math.ceil(count / limit), 1),
      assignments: rows
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
};

const submitAssignment = async (req, res) => {
  let stage = 'submit:init';
  try {
    stage = 'submit:parse-input';
    const { assignmentId } = req.params;
    const { codeContent, code, studentComments, comments, language } = req.body;

    const resolvedCode = codeContent ?? code;
    const resolvedComments = studentComments ?? comments;
    const normalizedContent = typeof resolvedCode === 'string' ? resolvedCode.trim() : '';
    const normalizedComments = typeof resolvedComments === 'string' ? resolvedComments.trim() : '';
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

    let submission;
      const payload = {
        codeContent: normalizedContent,
        studentComments: normalizedComments || null,
        language: safeLanguage || null,
        status: 'submitted'
      };

    stage = 'submit:transaction';
    await sequelize.transaction(async (transaction) => {
      stage = 'submit:load-assignment';
      const assignment = await Assignment.findOne({
        where: {
          id: assignmentId,
          studentId: req.user.id
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!assignment) {
        throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
      }

      if (assignment.status === 'submitted' || assignment.status === 'graded') {
        throw Object.assign(
          new Error('This assignment has already been submitted and cannot be edited'),
          { statusCode: 400 }
        );
      }

      stage = 'submit:load-submission';
      submission = await Submission.findOne({
        where: { assignmentId: assignment.id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const nextPayload = {
        ...payload,
        language: payload.language || submission?.language || null
      };

      stage = 'submit:upsert-submission';
      try {
        if (submission) {
          submission = await submission.update(nextPayload, { transaction });
        } else {
          submission = await Submission.create({
            assignmentId: assignment.id,
            ...nextPayload
          }, { transaction });
        }
      } catch (error) {
        const shouldFallbackSubmissionFields =
          isMissingColumnError(error, 'submissions', 'language')
          || isMissingColumnError(error, 'submissions', 'studentComments');

        if (!shouldFallbackSubmissionFields) {
          throw error;
        }

        const safeLegacyPayload = {
          codeContent: normalizedContent,
          status: 'submitted'
        };

        if (submission) {
          submission = await submission.update(safeLegacyPayload, { transaction });
        } else {
          submission = await Submission.create({
            assignmentId: assignment.id,
            ...safeLegacyPayload
          }, { transaction });
        }
      }

      stage = 'submit:update-assignment-status';
      try {
        await assignment.update({
          status: 'submitted',
          submittedAt: new Date()
        }, { transaction });
      } catch (error) {
        if (isMissingColumnError(error, 'assignments', 'submittedAt')) {
          await assignment.update({ status: 'submitted' }, { transaction });
        } else {
          throw error;
        }
      }
    });

    stage = 'submit:done';
    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json(withDebug({
        success: false,
        message: error.message
      }, `SUBMIT_FAIL_${stage}`));
    }

    if (error?.name === 'SequelizeDatabaseError') {
      console.error(`[submitAssignment] stage=${stage} db_error`, error);
      return res.status(503).json(withDebug({
        success: false,
        message: 'Submission service is temporarily unavailable due to a database schema issue. Please contact support.'
      }, `SUBMIT_DB_FAIL_${stage}`));
    }

    console.error(`[submitAssignment] stage=${stage}`, error);
    res.status(500).json(withDebug({
      success: false,
      message: 'An error occurred. Please try again later.'
    }, `SUBMIT_FAIL_${stage}`));
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
      message: 'An error occurred. Please try again later.'
    });
  }
};


// -- 1. Add to backend/controllers/projectController.js ------------------

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
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
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
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
};




const executeCode = async (req, res) => {
  let stage = 'execute:init';
  try {
    stage = 'execute:parse-input';
    const { code, language, stdin = '' } = req.body || {};
    const trimmedCode = typeof code === 'string' ? code.trim() : '';
    const selectedLanguage = typeof language === 'string' ? language.trim().toLowerCase() : '';

    if (!trimmedCode) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    stage = 'execute:resolve-language';
    const langConfig = JDOODLE_LANGUAGE_MAP[selectedLanguage];
    if (!langConfig) {
      return res.status(400).json({
        success: false,
        message: `Language '${selectedLanguage}' is not runnable`
      });
    }

    stage = 'execute:validate-jdoodle-config';
    const { clientId, clientSecret } = getJdoodleCredentials();
    if (!clientId || !clientSecret) {
      return res.status(503).json(withDebug({
        success: false,
        message: 'Code execution is not configured on the server. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET.'
      }, 'EXECUTE_FAIL_MISSING_JDOODLE_CONFIG'));
    }

    stage = 'execute:consume-quota';
    let usage = null;
    if (req.user?.role === 'student') {
      try {
        usage = await consumeStudentExecutionQuota(req.user.id);
      } catch (quotaError) {
        if (quotaError?.statusCode === 429) {
          throw quotaError;
        }

        if (isMissingRelationError(quotaError, 'execution_usages')) {
          console.error('Execution quota table missing, continuing without quota tracking.');
          usage = null;
        } else {
          throw quotaError;
        }
      }
    }

    stage = 'execute:call-jdoodle';
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

    stage = 'execute:parse-jdoodle-response';
    const rawBody = await response.text();
    let data = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (_err) {
      data = { output: rawBody };
    }

    if (!response.ok) {
      return res.status(response.status).json(withDebug({
        success: false,
        message: data.error || data.output || 'Code execution failed'
      }, `EXECUTE_FAIL_JDOODLE_HTTP_${response.status}`));
    }

    stage = 'execute:done';
    const statusCode = data.statusCode ?? 1;
    const success = statusCode === 200;

    return res.json({
      success,
      output: data.output || '',
      error: success ? '' : (data.output || data.error || 'Execution failed'),
      memory: data.memory ?? null,
      cpuTime: data.cpuTime ?? null,
      statusCode,
      usage
    });
  } catch (error) {
    if (error?.statusCode === 429) {
      return res.status(429).json(withDebug({
        success: false,
        message: error.message,
        usage: {
          used: Number(error.used) || STUDENT_DAILY_RUN_LIMIT,
          remaining: Number(error.remaining) || 0,
          limit: Number(error.limit) || STUDENT_DAILY_RUN_LIMIT
        }
      }, 'EXECUTE_FAIL_QUOTA_LIMIT'));
    }

    console.error(`[executeCode] stage=${stage}`, error);
    return res.status(500).json(withDebug({
      success: false,
      message: 'An error occurred. Please try again later.'
    }, `EXECUTE_FAIL_${stage}`));
  }
};

const getExecutionCredits = async (req, res) => {
  try {
    if (req.user?.role === 'student') {
      const usageDate = getTodayDateOnly();
      let row = null;
      try {
        row = await ExecutionUsage.findOne({
          where: { userId: req.user.id, usageDate },
          attributes: ['runCount']
        });
      } catch (error) {
        if (!isMissingRelationError(error, 'execution_usages')) {
          throw error;
        }
      }

      const used = Number(row?.runCount) || 0;
      return res.json({
        success: true,
        used,
        remaining: Math.max(STUDENT_DAILY_RUN_LIMIT - used, 0),
        limit: STUDENT_DAILY_RUN_LIMIT,
        scope: 'student_daily'
      });
    }

    const { clientId, clientSecret } = getJdoodleCredentials();
    if (!clientId || !clientSecret) {
      return res.status(503).json({
        success: false,
        message: 'Code execution is not configured on the server. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET.',
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
        message: 'An error occurred. Please try again later.',
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
      message: 'An error occurred. Please try again later.',
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


