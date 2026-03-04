import { useState } from 'react';
import projectService from '../../services/projectService';
import CodeEditor from '../editor/CodeEditor';

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
  if (!source.trim()) return 'java';
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

const resolveSubmissionLanguage = (submission) => {
  const savedLanguage = submission?.submission?.language;
  if (savedLanguage && LANGUAGE_LABELS[savedLanguage]) return savedLanguage;
  return detectLanguageFromCode(submission?.submission?.codeContent || '');
};

function GradingModal({ submission, maxMarks, onClose, onSuccess }) {
  const submissionData = submission?.submission || {};
  const [isCodeFullscreen, setIsCodeFullscreen] = useState(false);
  const language = resolveSubmissionLanguage(submission);
  const submittedAt = submission?.submittedAt || submissionData?.updatedAt;
  const studentName = submission?.student?.name || 'Unknown student';
  const studentEmail = submission?.student?.email || '-';
  const studentDepartment = submission?.student?.department || '-';
  const existingMarks = submissionData?.marks;

  const [marks, setMarks] = useState(submissionData?.marks ?? '');
  const [feedback, setFeedback] = useState(submissionData?.teacherFeedback || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (marks === '' || marks < 0 || marks > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setLoading(true);
    try {
      await projectService.gradeSubmission(
        submissionData.id,
        parseInt(marks, 10),
        feedback
      );
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`td-modal-overlay ${isCodeFullscreen ? 'td-modal-overlay--fullscreen' : ''}`}>
      <div className={`td-modal td-review-modal ${isCodeFullscreen ? 'td-review-modal--fullscreen' : ''}`}>
        <div className="td-modal-header">
          <div>
            <h2 className="td-card-title">Submission Review</h2>
            <p className="td-card-subtitle">
              {studentName} | {LANGUAGE_LABELS[language] || language}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {submissionData?.codeContent && (
              <button
                type="button"
                className="td-button ghost"
                onClick={() => setIsCodeFullscreen((prev) => !prev)}
              >
                {isCodeFullscreen ? 'Exit Full Screen' : 'Expand'}
              </button>
            )}
            <button className="td-button ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className={`td-review-grid ${isCodeFullscreen ? 'td-review-grid--fullscreen' : ''}`}>
          <div className="td-review-main">
            {submissionData?.codeContent ? (
              <div className="td-card td-review-code">
                <div className="td-review-code-header">
                  <h3 className="td-card-title" style={{ fontSize: 16 }}>Code</h3>
                  <span className="td-badge">{LANGUAGE_LABELS[language] || language}</span>
                </div>
                <div className="td-review-code-shell">
                  <CodeEditor
                    projectTitle="Student Submission"
                    maxMarks={maxMarks}
                    dueDate={submission?.submittedAt}
                    existingCode={submissionData.codeContent}
                    existingLang={language}
                    readOnly={true}
                    showRunButton={true}
                    showSubmitButton={false}
                    showDraftButton={false}
                    showCommentsField={false}
                    showStdinField={true}
                    shellHeight="100%"
                  />
                </div>
              </div>
            ) : (
              <div className="td-card">
                <h3 className="td-card-title" style={{ fontSize: 16 }}>Code</h3>
                <p className="td-card-subtitle">No code content was submitted.</p>
              </div>
            )}

            {submissionData?.fileUrls?.length > 0 && (
              <div className="td-card">
                <h3 className="td-card-title" style={{ fontSize: 16 }}>Uploaded Files</h3>
                <div className="td-list">
                  {submissionData.fileUrls.map((url, index) => (
                    <div key={url} className="td-list-item">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="td-link"
                      >
                        File {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`td-review-side ${isCodeFullscreen ? 'td-review-side--hidden' : ''}`}>
            <div className="td-card">
              <h3 className="td-card-title" style={{ fontSize: 16 }}>Student</h3>
              <div className="td-list" style={{ marginTop: 8 }}>
                <div className="td-list-item">
                  <span>Name</span>
                  <span>{studentName}</span>
                </div>
                <div className="td-list-item">
                  <span>Email</span>
                  <span>{studentEmail}</span>
                </div>
                <div className="td-list-item">
                  <span>Department</span>
                  <span>{studentDepartment}</span>
                </div>
                <div className="td-list-item">
                  <span>Submitted</span>
                  <span>{submittedAt ? new Date(submittedAt).toLocaleString() : '-'}</span>
                </div>
                <div className="td-list-item">
                  <span>Current Grade</span>
                  <span>{existingMarks ?? 'Not graded'}</span>
                </div>
              </div>
            </div>

            {submissionData?.studentComments && (
              <div className="td-card">
                <h3 className="td-card-title" style={{ fontSize: 16 }}>Student Comments</h3>
                <p className="td-card-subtitle">{submissionData.studentComments}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="td-card td-review-grade-form">
              <h3 className="td-card-title" style={{ fontSize: 16 }}>Grade</h3>
              {error && <div className="td-card-subtitle td-review-error">{error}</div>}

              <div>
                <label className="td-card-subtitle">Marks (out of {maxMarks}) *</label>
                <input
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  min="0"
                  max={maxMarks}
                  required
                  className="td-input"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="td-card-subtitle">Feedback & Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="td-textarea"
                  placeholder="Provide detailed feedback on the submission..."
                />
                <p className="td-help">Give clear feedback so the student can improve quickly.</p>
              </div>

              <div className="td-modal-footer td-review-actions">
                <button type="button" onClick={onClose} className="td-button ghost">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="td-button">
                  {loading ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradingModal;
