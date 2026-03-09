const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/projectController');

const { authenticateToken, checkRole } = require('../middleware/auth');
const { validateProject, validateAssignmentSubmit } = require('../middleware/validation');

router.get('/stats', authenticateToken, checkRole('teacher'), getTeacherStats);
router.get('/my-projects', authenticateToken, checkRole('teacher'), getMyProjects);
router.post('/', authenticateToken, checkRole('teacher'), validateProject, createProject);
router.post('/:projectId/assign', authenticateToken, checkRole('teacher'), assignProject);
router.get('/:projectId/submissions', authenticateToken, checkRole('teacher'), getProjectSubmissions);
router.put('/submissions/:submissionId/grade', authenticateToken, checkRole('teacher'), gradeSubmission);

router.get('/student/my-assignments', authenticateToken, checkRole('student'), getStudentAssignments);
router.post('/student/assignments/:assignmentId/submit', authenticateToken, checkRole('student'), validateAssignmentSubmit, submitAssignment);
router.post('/execute', authenticateToken, executeCode);
router.get('/execute/credits', authenticateToken, getExecutionCredits);

router.get('/director/stats', authenticateToken, checkRole('director'), getDirectorStats);
router.get('/all', authenticateToken, checkRole('director'), getAllProjectsEnhanced);
module.exports = router;
