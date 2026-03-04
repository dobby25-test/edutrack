import { useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import projectService from '../services/projectService';
import SubmitWithEditor from './editor/SubmitWithEditor';
import StudentProfile from './student/Studentprofile';
import { applyTheme, getInitialTheme, toggleTheme } from '../utils/theme';
import './studentDashboard.css';

function StudentDashboard() {
  const user = authService.getCurrentUser();
  const [theme, setTheme] = useState(getInitialTheme);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueSoon');
  const [editorAssignment, setEditorAssignment] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await projectService.getMyAssignments();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set();
    assignments.forEach((assignment) => {
      if (assignment.project?.subject) {
        uniqueSubjects.add(assignment.project.subject);
      }
    });
    return [...uniqueSubjects].sort();
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    const visible = assignments.filter((assignment) => {
      const project = assignment.project || {};
      const subject = (project.subject || '').toLowerCase();
      const title = (project.title || '').toLowerCase();
      const teacherName = (project.teacher?.name || '').toLowerCase();
      const department = (project.teacher?.department || '').toLowerCase();

      const matchesQuery =
        !loweredQuery ||
        title.includes(loweredQuery) ||
        subject.includes(loweredQuery) ||
        teacherName.includes(loweredQuery) ||
        department.includes(loweredQuery);

      const matchesStatus =
        statusFilter === 'all' || assignment.status === statusFilter;

      const matchesSubject =
        subjectFilter === 'all' || project.subject === subjectFilter;

      return matchesQuery && matchesStatus && matchesSubject;
    });

    visible.sort((a, b) => {
      const dueA = new Date(a.project?.dueDate || 0).getTime();
      const dueB = new Date(b.project?.dueDate || 0).getTime();
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();

      if (sortBy === 'dueSoon') return dueA - dueB;
      if (sortBy === 'dueLate') return dueB - dueA;
      return createdB - createdA;
    });

    return visible;
  }, [assignments, query, statusFilter, subjectFilter, sortBy]);

  const statusSummary = useMemo(() => {
    return assignments.reduce(
      (acc, assignment) => {
        acc.total += 1;
        acc[assignment.status] = (acc[assignment.status] || 0) + 1;
        return acc;
      },
      { total: 0, assigned: 0, in_progress: 0, submitted: 0, graded: 0 }
    );
  }, [assignments]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'No due date';
    return new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const map = {
      assigned: 'Assigned',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      graded: 'Graded'
    };
    return map[status] || status;
  };

  const openSubmissionModal = (assignment) => {
    setEditorAssignment(assignment);
  };

  const closeSubmissionModal = () => {
    setEditorAssignment(null);
  };

  return (
    <div className={`student-dashboard ${theme}`}>
      <header className="sd-header">
        <div className="sd-header-inner">
          <div>
            <h1 className="sd-title">Student Hub</h1>
            <p className="sd-subtitle">Track projects, deadlines, and grading updates.</p>
          </div>
          <div className="sd-actions">
            <span className="sd-pill">{user?.department || 'Department'}</span>
            <button className="sd-button ghost" onClick={() => setShowProfile(true)}>
              My Profile
            </button>
            <button
              className="sd-button ghost"
              onClick={() => setTheme((prev) => toggleTheme(prev))}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="sd-button danger" onClick={authService.logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="sd-shell">
        <section className="sd-card">
          <h2 className="sd-card-title">Welcome, {user?.name || 'Student'}</h2>
          <p className="sd-card-subtitle">{user?.email}</p>

          <div className="sd-metrics">
            <div className="sd-metric">
              <span>Total</span>
              <strong>{statusSummary.total}</strong>
            </div>
            <div className="sd-metric">
              <span>Assigned</span>
              <strong>{statusSummary.assigned}</strong>
            </div>
            <div className="sd-metric">
              <span>In Progress</span>
              <strong>{statusSummary.in_progress}</strong>
            </div>
            <div className="sd-metric">
              <span>Submitted</span>
              <strong>{statusSummary.submitted}</strong>
            </div>
            <div className="sd-metric">
              <span>Graded</span>
              <strong>{statusSummary.graded}</strong>
            </div>
          </div>
        </section>

        <section className="sd-card">
          <div className="sd-filters">
            <input
              className="sd-input"
              type="text"
              placeholder="Search by title, subject, teacher, or department"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="sd-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
            </select>
            <select
              className="sd-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              className="sd-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dueSoon">Due Date: Soonest</option>
              <option value="dueLate">Due Date: Latest</option>
              <option value="newest">Recently Assigned</option>
            </select>
          </div>
        </section>

        <section className="sd-card">
          <div className="sd-list-head">
            <h3 className="sd-card-title">My Assignments</h3>
            <span className="sd-card-subtitle">{filteredAssignments.length} shown</span>
          </div>

          {loading ? (
            <p className="sd-card-subtitle">Loading assignments...</p>
          ) : filteredAssignments.length === 0 ? (
            <p className="sd-card-subtitle">No assignments match your filters.</p>
          ) : (
            <div className="sd-list">
              {filteredAssignments.map((assignment) => (
                <article key={assignment.id} className="sd-list-item">
                  <div className="sd-list-main">
                    <div className="sd-list-top">
                      <h4 className="sd-project-title">{assignment.project?.title || 'Untitled Project'}</h4>
                      <span className={`sd-status ${assignment.status}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>
                    <p className="sd-meta">
                      {assignment.project?.subject || 'No subject'} | Teacher: {assignment.project?.teacher?.name || 'N/A'}
                    </p>
                    <p className="sd-meta">
                      Due: {formatDate(assignment.project?.dueDate)} | Max Marks: {assignment.project?.maxMarks ?? 'N/A'}
                    </p>
                    {assignment.project?.description && (
                      <p className="sd-meta">{assignment.project.description}</p>
                    )}
                    {assignment.project?.requirements && (
                      <p className="sd-meta">
                        <strong>Requirements:</strong> {assignment.project.requirements}
                      </p>
                    )}
                    {assignment.submission?.marks !== null && assignment.submission?.marks !== undefined && (
                      <p className="sd-meta">
                        Score: {assignment.submission.marks}/{assignment.project?.maxMarks ?? '-'}
                      </p>
                    )}
                    {assignment.submission?.teacherFeedback && (
                      <p className="sd-feedback">{assignment.submission.teacherFeedback}</p>
                    )}
                    <div className="sd-row-actions">
                      {assignment.status === 'graded' ? (
                        <button className="sd-button ghost" type="button" disabled>
                          Graded
                        </button>
                      ) : (
                        <button
                          className="sd-button"
                          type="button"
                          onClick={() => openSubmissionModal(assignment)}
                        >
                          {assignment.submission ? 'Edit & Resubmit' : 'Write & Submit'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {editorAssignment && (
        <SubmitWithEditor
          project={{
            assignmentId: editorAssignment.id,
            title: editorAssignment.project?.title || 'Assignment',
            subject: editorAssignment.project?.subject || '',
            maxMarks: editorAssignment.project?.maxMarks || 100,
            dueDate: editorAssignment.project?.dueDate,
            codeContent: editorAssignment.submission?.codeContent || ''
          }}
          onClose={closeSubmissionModal}
          onSuccess={async () => {
            closeSubmissionModal();
            await fetchAssignments();
          }}
        />
      )}

      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, overflow: 'auto' }}>
          <StudentProfile
            onClose={() => setShowProfile(false)}
            theme={theme}
            onToggleTheme={() => setTheme((prev) => toggleTheme(prev))}
          />
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
