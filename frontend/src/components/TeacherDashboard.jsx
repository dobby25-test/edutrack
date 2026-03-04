import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import projectService from '../services/projectService';
import CreateProjectModal from './teacher/CreateProjectModal';
import ProjectsList from './teacher/ProjectList';
import SubmissionsView from './teacher/SubmissionView';
import ReportsView from './teacher/ReportsView';
import StatsCards from './teacher/StatsCards';
import StudentSelector from './teacher/StudentSelector';
import TeacherProfile from './teacher/TeacherProfile';
import './teacher/teacherDashboard.css';

function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('eduTheme') || 'dark');

  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    localStorage.setItem('eduTheme', theme);
  }, [theme]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData] = await Promise.all([
        projectService.getTeacherStats(),
        projectService.getMyProjects()
      ]);

      setStats(statsData.stats);
      setProjects(projectsData.projects);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleOpenAssignModal = (project) => {
    setSelectedProject(project);
    setShowStudentSelector(true);
  };

  const handleAssignProject = async (projectId, studentIds) => {
    try {
      await projectService.assignProject(projectId, studentIds);
      setShowStudentSelector(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to assign project:', error);
      alert(error.message || 'Failed to assign students');
    }
  };

  if (loading) {
    return (
      <div className={`teacher-dashboard ${theme}`}>
        <div className="td-shell">
          <div className="td-card">
            <h2 className="td-card-title">Loading dashboard...</h2>
            <p className="td-card-subtitle">Fetching latest projects and reviews.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`teacher-dashboard ${theme}`}>
      <header className="td-header">
        <div className="td-header-inner">
          <div className="td-brand">
            <span className="td-title">Teacher Command</span>
            <span className="td-subtitle">Welcome back, {user?.name || 'Instructor'}</span>
          </div>
          <div className="td-actions">
            <span className="td-pill">{user?.department || 'Department'}</span>
            <button className="td-button ghost" onClick={() => setShowProfile(true)}>
              My Profile
            </button>
            <button
              className="td-button ghost"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="td-button danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="td-tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`td-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`td-tab ${activeTab === 'projects' ? 'active' : ''}`}
          >
            My Projects
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`td-tab ${activeTab === 'submissions' ? 'active' : ''}`}
          >
            Pending Reviews ({stats?.pendingReviews || 0})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`td-tab ${activeTab === 'reports' ? 'active' : ''}`}
          >
            Reports
          </button>
        </div>
      </header>

      <main className="td-shell td-main">
        {activeTab === 'overview' && (
          <div className="td-section">
            <StatsCards stats={stats} />

            <div className="td-section td-card">
              <div className="td-list-item">
                <div>
                  <h2 className="td-card-title">Quick Actions</h2>
                  <p className="td-card-subtitle">Start building assignments and grading.</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="td-button">
                  <span>Create New Project</span>
                </button>
              </div>
            </div>

            <div className="td-grid two">
              <div className="td-card">
                <h3 className="td-card-title">Recent Projects</h3>
                <p className="td-card-subtitle">Latest assignments you created.</p>
                <div className="td-list" style={{ marginTop: 12 }}>
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="td-list-item">
                      <div>
                        <div className="td-card-title" style={{ fontSize: 16 }}>
                          {project.title}
                        </div>
                        <div className="td-card-subtitle">
                          {project.stats?.totalStudents} students - {project.stats?.submitted} submitted
                        </div>
                      </div>
                      <button
                        className="td-button ghost"
                        onClick={() => {
                          setSelectedProject(project);
                          setActiveTab('projects');
                        }}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="td-card">
                <h3 className="td-card-title">Pending Reviews</h3>
                <p className="td-card-subtitle">Submissions waiting for your feedback.</p>
                <div className="td-list" style={{ marginTop: 12 }}>
                  {projects
                    .filter((p) => p.stats?.submitted > p.stats?.graded)
                    .slice(0, 3)
                    .map((project) => (
                      <div key={project.id} className="td-list-item">
                        <div>
                          <div className="td-card-title" style={{ fontSize: 16 }}>
                            {project.title}
                          </div>
                          <div className="td-card-subtitle">
                            {project.stats?.submitted - project.stats?.graded} pending
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setActiveTab('submissions');
                          }}
                          className="td-link"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <ProjectsList
            projects={projects}
            onCreateNew={() => setShowCreateModal(true)}
            onAssignProject={handleOpenAssignModal}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsView
            projects={projects}
            selectedProject={selectedProject}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView projects={projects} />
        )}
      </main>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDashboardData();
          }}
        />
      )}

      {showStudentSelector && selectedProject && (
        <StudentSelector
          projectId={selectedProject.id}
          onAssign={handleAssignProject}
          onClose={() => setShowStudentSelector(false)}
        />
      )}

      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: '#f8fafc', overflow: 'auto' }}>
          <TeacherProfile
            onClose={() => setShowProfile(false)}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          />
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
