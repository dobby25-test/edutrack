import { useCallback, useEffect, useMemo, useState } from 'react';
import projectService from '../../services/projectService';
import GradingModal from './GradingModal';

const LANGUAGE_LABELS = {
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  ruby: 'Ruby',
  go: 'Go',
  rust: 'Rust',
  kotlin: 'Kotlin',
  swift: 'Swift',
  sql: 'SQL',
  html: 'HTML'
};

const detectLanguageFromCode = (code = '') => {
  const source = String(code).toLowerCase();
  if (!source.trim()) return 'unknown';
  if (source.includes('<!doctype html') || source.includes('<html')) return 'html';
  if (source.includes('def ') || source.includes('print(')) return 'python';
  if (source.includes('console.log(') || source.includes('function ')) return 'javascript';
  if (source.includes('#include <iostream') || source.includes('std::')) return 'cpp';
  if (source.includes('#include <stdio.h')) return 'c';
  if (source.includes('<?php')) return 'php';
  if (source.includes('puts ') || source.includes('end')) return 'ruby';
  if (source.includes('package main') || source.includes('fmt.println')) return 'go';
  if (source.includes('fn main()')) return 'rust';
  if (source.includes('fun main()')) return 'kotlin';
  if (source.includes('select ') || source.includes('from ')) return 'sql';
  return 'java';
};

const getSubmissionLanguage = (assignment) => {
  const saved = assignment?.submission?.language;
  if (saved && LANGUAGE_LABELS[saved]) return saved;
  return detectLanguageFromCode(assignment?.submission?.codeContent || '');
};

function SubmissionsView({ projects, selectedProject, onRefresh }) {
  const [project, setProject] = useState(selectedProject);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submitted_latest');

  const fetchSubmissions = useCallback(async () => {
    if (!project) return;
    try {
      setLoading(true);
      const data = await projectService.getProjectSubmissions(project.id);
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    setProject(selectedProject || null);
  }, [selectedProject]);

  useEffect(() => {
    if (project) {
      fetchSubmissions();
    }
  }, [project, fetchSubmissions]);

  const handleGrade = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const getStatusBadge = (status) => {
    const map = {
      assigned: 'Not Started',
      in_progress: 'In Progress',
      submitted: 'Pending Review',
      graded: 'Graded'
    };
    return map[status] || 'Not Started';
  };

  const departments = useMemo(() => {
    const uniqueDepartments = new Set();
    submissions.forEach((assignment) => {
      if (assignment.student?.department) {
        uniqueDepartments.add(assignment.student.department);
      }
    });
    return [...uniqueDepartments].sort();
  }, [submissions]);

  const languages = useMemo(() => {
    const uniqueLanguages = new Set();
    submissions.forEach((assignment) => {
      const lang = getSubmissionLanguage(assignment);
      if (lang && lang !== 'unknown') {
        uniqueLanguages.add(lang);
      }
    });
    return [...uniqueLanguages].sort((a, b) =>
      (LANGUAGE_LABELS[a] || a).localeCompare(LANGUAGE_LABELS[b] || b)
    );
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const search = query.trim().toLowerCase();

    const visible = submissions.filter((assignment) => {
      const studentName = (assignment.student?.name || '').toLowerCase();
      const email = (assignment.student?.email || '').toLowerCase();
      const department = (assignment.student?.department || '').toLowerCase();

      const matchesQuery =
        !search || studentName.includes(search) || email.includes(search) || department.includes(search);

      const matchesStatus =
        statusFilter === 'all' || assignment.status === statusFilter;

      const matchesDepartment =
        departmentFilter === 'all' || assignment.student?.department === departmentFilter;

      const assignmentLanguage = getSubmissionLanguage(assignment);
      const matchesLanguage = languageFilter === 'all' || assignmentLanguage === languageFilter;

      return matchesQuery && matchesStatus && matchesDepartment && matchesLanguage;
    });

    visible.sort((a, b) => {
      const submittedA = new Date(a.submittedAt || 0).getTime();
      const submittedB = new Date(b.submittedAt || 0).getTime();
      const marksA = a.submission?.marks ?? -1;
      const marksB = b.submission?.marks ?? -1;
      const nameA = (a.student?.name || '').toLowerCase();
      const nameB = (b.student?.name || '').toLowerCase();

      if (sortBy === 'submitted_oldest') return submittedA - submittedB;
      if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
      if (sortBy === 'marks_desc') return marksB - marksA;
      return submittedB - submittedA;
    });

    return visible;
  }, [submissions, query, statusFilter, departmentFilter, languageFilter, sortBy]);

  if (!project) {
    return (
      <div className="td-card">
        <h2 className="td-card-title">Student Submissions</h2>
        <p className="td-card-subtitle">Select a project to view submissions.</p>
        <div style={{ marginTop: 16 }}>
          <select
            onChange={(e) => {
              const selected = projects.find((p) => p.id === Number(e.target.value));
              setProject(selected);
            }}
            className="td-select"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.stats?.submitted || 0} submissions)
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="td-section">
      <div className="td-card">
        <div className="td-list-item">
          <div>
            <h2 className="td-card-title">{project.title}</h2>
            <p className="td-card-subtitle">
              Total Students: {submissions.length} - Submitted:{' '}
              {submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length}{' '}
              - Graded: {submissions.filter((s) => s.status === 'graded').length}
            </p>
          </div>
          <button onClick={() => setProject(null)} className="td-button ghost">
            Change Project
          </button>
        </div>
        <div className="td-filters" style={{ marginTop: 14 }}>
          <input
            className="td-input"
            type="text"
            placeholder="Search by student name, email, or department"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="td-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="assigned">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Pending Review</option>
            <option value="graded">Graded</option>
          </select>
          <select
            className="td-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <select
            className="td-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="submitted_latest">Submitted: Latest</option>
            <option value="submitted_oldest">Submitted: Oldest</option>
            <option value="marks_desc">Marks: High to Low</option>
            <option value="name_asc">Student Name A-Z</option>
          </select>
          <select
            className="td-select"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="all">All Languages</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {LANGUAGE_LABELS[language] || language}
              </option>
            ))}
          </select>
        </div>
        <p className="td-card-subtitle" style={{ marginTop: 10 }}>
          Showing {filteredSubmissions.length} of {submissions.length} students
        </p>
      </div>

      {loading ? (
        <div className="td-card" style={{ marginTop: 18 }}>
          <p className="td-card-subtitle">Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="td-card" style={{ marginTop: 18 }}>
          <p className="td-card-subtitle">No submissions match your filters.</p>
        </div>
      ) : (
        <div className="td-card" style={{ marginTop: 18 }}>
          <div className="td-table-wrap">
            <table className="td-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Language</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <div>{assignment.student.name}</div>
                      <div className="td-card-subtitle">{assignment.student.email}</div>
                    </td>
                    <td>{assignment.student.department}</td>
                    <td>
                      <span className={`td-badge td-status-${assignment.status}`}>
                        {getStatusBadge(assignment.status)}
                      </span>
                    </td>
                    <td>
                      {assignment.submittedAt
                        ? new Date(assignment.submittedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>{LANGUAGE_LABELS[getSubmissionLanguage(assignment)] || '-'}</td>
                    <td>
                      {assignment.submission?.marks !== null &&
                      assignment.submission?.marks !== undefined ? (
                        <span>
                          {assignment.submission.marks} / {project.maxMarks}
                        </span>
                      ) : (
                        <span className="td-card-subtitle">Not graded</span>
                      )}
                    </td>
                    <td>
                      {assignment.status === 'submitted' || assignment.status === 'graded' ? (
                        <button className="td-link" onClick={() => handleGrade(assignment)}>
                          {assignment.status === 'graded' ? 'Open Review' : 'Review & Grade'}
                        </button>
                      ) : (
                        <span className="td-card-subtitle">Waiting for submission</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showGradingModal && selectedSubmission && (
        <GradingModal
          submission={selectedSubmission}
          maxMarks={project.maxMarks}
          onClose={() => {
            setShowGradingModal(false);
            setSelectedSubmission(null);
          }}
          onSuccess={() => {
            setShowGradingModal(false);
            setSelectedSubmission(null);
            fetchSubmissions();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export default SubmissionsView;
