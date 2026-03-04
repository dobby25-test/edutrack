import api from './api';

const projectService = {
  // Create new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create project' };
    }
  },

  // Assign project to students
  assignProject: async (projectId, studentIds) => {
    try {
      const response = await api.post(`/projects/${projectId}/assign`, {
        studentIds
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign project' };
    }
  },

  // Get teacher's projects
  getMyProjects: async () => {
    try {
      const response = await api.get('/projects/my-projects');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch projects' };
    }
  },

  // Get project submissions
  getProjectSubmissions: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/submissions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch submissions' };
    }
  },

  // Grade a submission
  gradeSubmission: async (submissionId, marks, feedback) => {
    try {
      const response = await api.put(`/projects/submissions/${submissionId}/grade`, {
        marks,
        feedback
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to grade submission' };
    }
  },

  // Get teacher statistics
  getTeacherStats: async () => {
    try {
      const response = await api.get('/projects/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch statistics' };
    }
  },

  // Get all students (for assignment)
  getAllStudents: async () => {
    try {
      const response = await api.get('/auth/students'); // We'll create this
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch students' };
    }
  },

  // Get student's own assignments
  getMyAssignments: async () => {
    try {
      const response = await api.get('/projects/student/my-assignments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch assignments' };
    }
  },

  // Submit student's assignment response
  submitAssignment: async (assignmentId, submissionData) => {
    try {
      const response = await api.post(
        `/projects/student/assignments/${assignmentId}/submit`,
        submissionData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit assignment' };
    }
  }
};

export default projectService;
