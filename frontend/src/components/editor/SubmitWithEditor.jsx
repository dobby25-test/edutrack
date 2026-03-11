import { useMemo, useState } from 'react';
import CodeEditor from './CodeEditor';
import projectService from '../../services/projectService';

export default function SubmitWithEditor({ project, onClose, onSuccess }) {
  const [error, setError] = useState('');

  const assignmentId = project?.assignmentId;
  const draftKey = `edutrack_draft_${assignmentId}`;

  const draft = useMemo(() => {
    if (!assignmentId) return null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, [assignmentId, draftKey]);

  const guessLang = () => {
    if (project?.submissionLanguage) {
      return String(project.submissionLanguage).toLowerCase();
    }

    const searchPool = [project?.subject, project?.title, project?.description, project?.requirements]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (searchPool.includes('java')) return 'java';
    if (searchPool.includes('python')) return 'python';
    if (searchPool.includes('javascript') || searchPool.includes(' js ')) return 'javascript';
    if (searchPool.includes('c++') || searchPool.includes('cpp')) return 'cpp';
    if (searchPool.includes('html') || searchPool.includes('web')) return 'html';
    if (searchPool.includes('sql') || searchPool.includes('database')) return 'sql';
    if (searchPool.includes('golang') || searchPool.includes(' go ')) return 'go';
    if (searchPool.includes('rust')) return 'rust';
    if (searchPool.includes('kotlin')) return 'kotlin';
    if (searchPool.includes('swift')) return 'swift';
    if (searchPool.includes('ruby')) return 'ruby';
    if (searchPool.includes('php')) return 'php';
    if (searchPool.includes(' c ')) return 'c';
    return 'java';
  };

  const handleSubmit = async (code, language, comments) => {
    setError('');
    try {
      if (!assignmentId) {
        throw new Error('Missing assignment id. Please refresh and try again.');
      }

      await projectService.submitAssignment(assignmentId, {
        codeContent: code,
        studentComments: comments,
        language,
      });

      localStorage.removeItem(draftKey);
      onSuccess?.();
    } catch (err) {
      const isAxiosError = Boolean(err?.response);
      const apiMessage = err?.response?.data?.message || err?.message;
      const apiError = err?.response?.data?.error;
      const status = err?.response?.status;
      const networkIssue = !isAxiosError && !apiMessage;

      let nextError = apiMessage || err.message || 'Submission failed. Try again.';
      if (networkIssue) {
        nextError = 'Cannot reach backend API. Verify backend is running and VITE_API_URL is correct.';
      } else if (apiError) {
        nextError = `${nextError} (${apiError})`;
      } else if (status && status >= 500) {
        nextError = `${nextError} (server error ${status})`;
      }

      setError(nextError);
      throw err;
    }
  };

  const handleSaveDraft = async (code, language) => {
    if (!assignmentId) {
      setError('Missing assignment id. Please refresh this page.');
      return;
    }
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ codeContent: code, language, savedAt: Date.now() })
      );
    } catch {
      setError('Could not save draft in this browser.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: '#13131f',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#6c7086',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
          >
            {'<- Back'}
          </button>
          <span style={{ color: '#6c7086', fontSize: 12 }}>
            Submitting for: <strong style={{ color: '#cdd6f4' }}>{project.title}</strong>
          </span>
        </div>
        {error && (
          <span
            style={{
              color: '#f38ba8',
              fontSize: 12,
              background: 'rgba(243,139,168,0.1)',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            ! {error}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CodeEditor
          projectTitle={project.title}
          maxMarks={project.maxMarks}
          dueDate={project.dueDate}
          shellHeight="100%"
          existingLang={draft?.language || guessLang()}
          existingCode={draft?.codeContent || project.codeContent || ''}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </div>
  );
}
