import { useMemo, useState } from 'react';

function ProjectsList({ projects, onCreateNew, onAssignProject }) {
  const [expandedProjectIds, setExpandedProjectIds] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (project) => {
    const { totalStudents, submitted, graded } = project.stats || {};
    if (graded === totalStudents && totalStudents > 0) return 'Completed';
    if (submitted > 0) return 'In Progress';
    return 'Active';
  };

  const getStatusKey = (project) => {
    const { totalStudents, submitted, graded } = project.stats || {};
    if (graded === totalStudents && totalStudents > 0) return 'completed';
    if (submitted > 0) return 'in_progress';
    return 'active';
  };

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set();
    projects.forEach((project) => {
      if (project.subject) uniqueSubjects.add(project.subject);
    });
    return [...uniqueSubjects].sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const search = query.trim().toLowerCase();

    const visible = projects.filter((project) => {
      const matchesQuery =
        !search ||
        project.title?.toLowerCase().includes(search) ||
        project.subject?.toLowerCase().includes(search) ||
        project.description?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'all' || getStatusKey(project) === statusFilter;

      const matchesSubject =
        subjectFilter === 'all' || project.subject === subjectFilter;

      return matchesQuery && matchesStatus && matchesSubject;
    });

    visible.sort((a, b) => {
      const dueA = new Date(a.dueDate || 0).getTime();
      const dueB = new Date(b.dueDate || 0).getTime();
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();

      if (sortBy === 'due_soon') return dueA - dueB;
      if (sortBy === 'due_late') return dueB - dueA;
      return createdB - createdA;
    });

    return visible;
  }, [projects, query, statusFilter, subjectFilter, sortBy]);

  const toggleProjectDetails = (projectId) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <div className="td-section">
      <div className="td-card">
        <div className="td-list-item">
          <div>
            <h2 className="td-card-title">My Projects</h2>
            <p className="td-card-subtitle">Create, assign, and review your projects.</p>
          </div>
          <button onClick={onCreateNew} className="td-button">
            Create New Project
          </button>
        </div>
        <div className="td-filters" style={{ marginTop: 14 }}>
          <input
            className="td-input"
            type="text"
            placeholder="Search by title, subject, or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="td-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="td-select"
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
            className="td-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Recently Created</option>
            <option value="due_soon">Due Date: Soonest</option>
            <option value="due_late">Due Date: Latest</option>
          </select>
        </div>
        <p className="td-card-subtitle" style={{ marginTop: 10 }}>
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="td-card" style={{ marginTop: 18 }}>
          <h3 className="td-card-title">No projects yet</h3>
          <p className="td-card-subtitle">
            Create your first project to start assigning tasks to students.
          </p>
          <div style={{ marginTop: 14 }}>
            <button onClick={onCreateNew} className="td-button">
              Create First Project
            </button>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="td-card" style={{ marginTop: 18 }}>
          <h3 className="td-card-title">No matching projects</h3>
          <p className="td-card-subtitle">Try changing search or filter options.</p>
        </div>
      ) : (
        <div className="td-grid" style={{ marginTop: 18 }}>
          {filteredProjects.map((project) => (
            <div key={project.id} className="td-card">
              {(() => {
                const isExpanded = expandedProjectIds.includes(project.id);
                return (
                  <>
              <div className="td-list-item" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="td-card-title">{project.title}</div>
                  {project.subject && (
                    <div className="td-card-subtitle">{project.subject}</div>
                  )}
                </div>
                <span className="td-badge">{getStatusBadge(project)}</span>
              </div>

              <div className="td-list" style={{ marginTop: 14 }}>
                <div className="td-list-item">
                  <span>Due</span>
                  <span>{formatDate(project.dueDate)}</span>
                </div>
                <div className="td-list-item">
                  <span>Total Students</span>
                  <span>{project.stats?.totalStudents || 0}</span>
                </div>
                <div className="td-list-item">
                  <span>Submitted</span>
                  <span>{project.stats?.submitted || 0}</span>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="td-button ghost"
                  onClick={() => toggleProjectDetails(project.id)}
                >
                  {isExpanded ? 'Hide Full Details' : 'Show Full Details'}
                </button>
                <button
                  className="td-button"
                  onClick={() => onAssignProject(project)}
                >
                  Assign Students
                </button>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 16 }}>
                  {project.description && (
                    <p className="td-card-subtitle" style={{ marginBottom: 14 }}>
                      {project.description}
                    </p>
                  )}

                  <div className="td-list">
                    <div className="td-list-item">
                      <span>Graded</span>
                      <span>{project.stats?.graded || 0}</span>
                    </div>
                    <div className="td-list-item">
                      <span>Pending Submission</span>
                      <span>{project.stats?.pending || 0}</span>
                    </div>
                    <div className="td-list-item">
                      <span>Max Marks</span>
                      <span>{project.maxMarks}</span>
                    </div>
                  </div>

                  {project.requirements && (
                    <div style={{ marginTop: 14 }}>
                      <div className="td-card-title" style={{ fontSize: 15 }}>
                        Requirements
                      </div>
                      <div className="td-card-subtitle">{project.requirements}</div>
                    </div>
                  )}
                </div>
              )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsList;
