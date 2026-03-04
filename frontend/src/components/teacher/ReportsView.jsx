import { useMemo } from 'react';

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
const REPORT_REFERENCE_TIME = new Date().getTime();

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

const percent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);
const clampPercent = (value) => Math.max(0, Math.min(100, value));

function ReportsView({ projects }) {
  const analysis = useMemo(() => {
    const allAssignments = projects.flatMap((project) => project.assignments || []);
    const totalProjects = projects.length;
    const totalAssigned = allAssignments.length;
    const totalSubmitted = allAssignments.filter(
      (a) => a.status === 'submitted' || a.status === 'graded'
    ).length;
    const totalGraded = allAssignments.filter((a) => a.status === 'graded').length;
    const pendingSubmission = allAssignments.filter(
      (a) => a.status === 'assigned' || a.status === 'in_progress'
    ).length;
    const pendingReview = allAssignments.filter((a) => a.status === 'submitted').length;

    const gradedMarks = allAssignments
      .map((a) => a.submission?.marks)
      .filter((marks) => marks !== null && marks !== undefined);
    const averageMarks = gradedMarks.length
      ? Math.round(gradedMarks.reduce((sum, marks) => sum + marks, 0) / gradedMarks.length)
      : 0;

    const scoreBands = {
      excellent: 0,
      good: 0,
      average: 0,
      needsSupport: 0
    };
    gradedMarks.forEach((marks) => {
      if (marks >= 90) scoreBands.excellent += 1;
      else if (marks >= 75) scoreBands.good += 1;
      else if (marks >= 60) scoreBands.average += 1;
      else scoreBands.needsSupport += 1;
    });

    const languageMap = {};
    allAssignments.forEach((assignment) => {
      const savedLang = assignment.submission?.language;
      const lang =
        (savedLang && LANGUAGE_LABELS[savedLang] && savedLang) ||
        detectLanguageFromCode(assignment.submission?.codeContent || '');
      if (lang !== 'unknown' && (assignment.status === 'submitted' || assignment.status === 'graded')) {
        languageMap[lang] = (languageMap[lang] || 0) + 1;
      }
    });
    const languageBreakdown = Object.entries(languageMap)
      .map(([id, count]) => ({ id, label: LANGUAGE_LABELS[id] || id, count }))
      .sort((a, b) => b.count - a.count);

    const projectRows = projects.map((project) => {
      const assignments = project.assignments || [];
      const assigned = assignments.length;
      const submitted = assignments.filter(
        (a) => a.status === 'submitted' || a.status === 'graded'
      ).length;
      const graded = assignments.filter((a) => a.status === 'graded').length;
      const pendingReviews = assignments.filter((a) => a.status === 'submitted').length;
      const marks = assignments
        .map((a) => a.submission?.marks)
        .filter((marks) => marks !== null && marks !== undefined);
      const avgMarks = marks.length
        ? Math.round(marks.reduce((sum, marks) => sum + marks, 0) / marks.length)
        : null;
      const dueDate = project.dueDate ? new Date(project.dueDate) : null;
      const overdue = dueDate ? dueDate.getTime() < REPORT_REFERENCE_TIME : false;
      const submissionRate = percent(submitted, assigned);

      return {
        id: project.id,
        title: project.title,
        assigned,
        submitted,
        graded,
        pendingReviews,
        avgMarks,
        overdue,
        submissionRate,
        dueDate
      };
    });

    const topPendingProject = [...projectRows].sort((a, b) => b.pendingReviews - a.pendingReviews)[0];
    const lowestSubmissionProject = [...projectRows]
      .filter((row) => row.assigned > 0)
      .sort((a, b) => a.submissionRate - b.submissionRate)[0];
    const overdueProjects = projectRows.filter((row) => row.overdue && row.submissionRate < 100);

    return {
      totalProjects,
      totalAssigned,
      totalSubmitted,
      totalGraded,
      pendingSubmission,
      pendingReview,
      submissionRate: percent(totalSubmitted, totalAssigned),
      gradingCoverage: percent(totalGraded, totalSubmitted),
      averageMarks,
      scoreBands,
      languageBreakdown,
      projectRows,
      topPendingProject,
      lowestSubmissionProject,
      overdueProjects
    };
  }, [projects]);

  if (!projects?.length) {
    return (
      <div className="td-card">
        <h2 className="td-card-title">Performance Reports</h2>
        <p className="td-card-subtitle">Create and assign projects to unlock report analytics.</p>
      </div>
    );
  }

  return (
    <div className="td-section">
      <div className="td-card">
        <h2 className="td-card-title">Performance Reports</h2>
        <p className="td-card-subtitle">
          Assignment pipeline, score quality, language usage, and project risk insights.
        </p>
      </div>

      <div className="td-grid td-reports-kpis">
        <div className="td-card td-report-kpi">
          <p className="td-metric-label">Submission Rate</p>
          <p className="td-metric-value">{analysis.submissionRate}%</p>
          <div className="td-progress">
            <span style={{ width: `${clampPercent(analysis.submissionRate)}%` }} />
          </div>
          <p className="td-card-subtitle">
            {analysis.totalSubmitted} of {analysis.totalAssigned} assigned
          </p>
        </div>
        <div className="td-card td-report-kpi">
          <p className="td-metric-label">Grading Coverage</p>
          <p className="td-metric-value">{analysis.gradingCoverage}%</p>
          <div className="td-progress">
            <span style={{ width: `${clampPercent(analysis.gradingCoverage)}%` }} />
          </div>
          <p className="td-card-subtitle">
            {analysis.totalGraded} graded out of {analysis.totalSubmitted} submitted
          </p>
        </div>
        <div className="td-card td-report-kpi">
          <p className="td-metric-label">Average Score</p>
          <p className="td-metric-value">{analysis.averageMarks}</p>
          <p className="td-card-subtitle">Across all graded submissions</p>
        </div>
        <div className="td-card td-report-kpi">
          <p className="td-metric-label">Projects Tracked</p>
          <p className="td-metric-value">{analysis.totalProjects}</p>
          <p className="td-card-subtitle">
            {analysis.pendingReview} pending review, {analysis.pendingSubmission} pending submission
          </p>
        </div>
      </div>

      <div className="td-grid two">
        <div className="td-card">
          <h3 className="td-card-title">Submission Pipeline</h3>
          <div className="td-report-list">
            <div className="td-report-item">
              <span>Total Assigned</span>
              <strong>{analysis.totalAssigned}</strong>
            </div>
            <div className="td-report-item">
              <span>Awaiting Submission</span>
              <strong>{analysis.pendingSubmission}</strong>
            </div>
            <div className="td-report-item">
              <span>Pending Review</span>
              <strong>{analysis.pendingReview}</strong>
            </div>
            <div className="td-report-item">
              <span>Graded</span>
              <strong>{analysis.totalGraded}</strong>
            </div>
          </div>
        </div>

        <div className="td-card">
          <h3 className="td-card-title">Score Distribution</h3>
          <div className="td-report-list">
            <div className="td-report-item">
              <span>90-100 (Excellent)</span>
              <strong>{analysis.scoreBands.excellent}</strong>
            </div>
            <div className="td-report-item">
              <span>75-89 (Good)</span>
              <strong>{analysis.scoreBands.good}</strong>
            </div>
            <div className="td-report-item">
              <span>60-74 (Average)</span>
              <strong>{analysis.scoreBands.average}</strong>
            </div>
            <div className="td-report-item">
              <span>Below 60 (Needs Support)</span>
              <strong>{analysis.scoreBands.needsSupport}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="td-grid two">
        <div className="td-card">
          <h3 className="td-card-title">Language Usage</h3>
          {analysis.languageBreakdown.length === 0 ? (
            <p className="td-card-subtitle">No submitted code yet.</p>
          ) : (
            <div className="td-report-list">
              {analysis.languageBreakdown.slice(0, 8).map((entry) => (
                <div key={entry.id} className="td-report-item">
                  <span>{entry.label}</span>
                  <strong>{entry.count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="td-card">
          <h3 className="td-card-title">Actionable Insights</h3>
          <div className="td-report-list">
            <div className="td-report-item td-report-item-text">
              <span>Highest Pending Reviews</span>
              <strong>{analysis.topPendingProject?.title || 'N/A'}</strong>
            </div>
            <div className="td-report-item td-report-item-text">
              <span>Lowest Submission Rate</span>
              <strong>
                {analysis.lowestSubmissionProject
                  ? `${analysis.lowestSubmissionProject.title} (${analysis.lowestSubmissionProject.submissionRate}%)`
                  : 'N/A'}
              </strong>
            </div>
            <div className="td-report-item td-report-item-text">
              <span>Overdue Projects With Pending Work</span>
              <strong>{analysis.overdueProjects.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="td-card">
        <h3 className="td-card-title">Project-Level Analysis</h3>
        <div className="td-table-wrap" style={{ marginTop: 10 }}>
          <table className="td-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Assigned</th>
                <th>Submitted</th>
                <th>Submission Rate</th>
                <th>Pending Review</th>
                <th>Average Score</th>
              </tr>
            </thead>
            <tbody>
              {analysis.projectRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div>{row.title}</div>
                    <div className="td-card-subtitle">
                      {row.overdue ? 'Overdue' : row.dueDate ? `Due ${row.dueDate.toLocaleDateString()}` : 'No due date'}
                    </div>
                  </td>
                  <td>{row.assigned}</td>
                  <td>{row.submitted}</td>
                  <td>{row.submissionRate}%</td>
                  <td>{row.pendingReviews}</td>
                  <td>{row.avgMarks ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
