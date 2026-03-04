// frontend/src/components/editor/SubmitWithEditor.jsx
// Drop-in replacement for the basic submit modal in StudentDashboard
// Usage: <SubmitWithEditor project={project} onClose={fn} onSuccess={fn} />

import { useState } from 'react';
import CodeEditor from './CodeEditor';
import api from '../../services/api';

export default function SubmitWithEditor({ project, onClose, onSuccess }) {
  const [error,   setError]   = useState('');

  // Auto-detect language from project subject
  const guessLang = () => {
    const s = (project.subject || '').toLowerCase();
    if (s.includes('java'))       return 'java';
    if (s.includes('python'))     return 'python';
    if (s.includes('javascript') || s.includes('js')) return 'javascript';
    if (s.includes('c++') || s.includes('cpp'))       return 'cpp';
    if (s.includes('web') || s.includes('html'))      return 'html';
    if (s.includes('sql') || s.includes('database'))  return 'sql';
    return 'java';
  };

  const handleSubmit = async (code, language, comments) => {
    setError('');
    try {
      await api.post(`/projects/student/assignments/${project.assignmentId}/submit`, {
        codeContent:     code,
        studentComments: comments,
        language,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Try again.');
      throw err; // re-throw so CodeEditor knows it failed
    }
  };

  const handleSaveDraft = async (code, language) => {
    localStorage.setItem(
      `edutrack_draft_${project.assignmentId}`,
      JSON.stringify({ codeContent: code, language, savedAt: Date.now() })
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Mini header with close button */}
      <div style={{
        background: '#13131f', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 16px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#6c7086', cursor: 'pointer',
            padding: '4px 10px', fontSize: 12, fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}>
            ← Back
          </button>
          <span style={{ color: '#6c7086', fontSize: 12 }}>
            Submitting for: <strong style={{ color: '#cdd6f4' }}>{project.title}</strong>
          </span>
        </div>
        {error && (
          <span style={{
            color: '#f38ba8', fontSize: 12,
            background: 'rgba(243,139,168,0.1)',
            padding: '4px 10px', borderRadius: 6,
          }}>
            ⚠ {error}
          </span>
        )}
      </div>

      {/* Editor takes remaining height */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CodeEditor
          projectTitle={project.title}
          maxMarks={project.maxMarks}
          dueDate={project.dueDate}
          shellHeight="100%"
          existingLang={guessLang()}
          existingCode={project.codeContent || ''}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </div>
  );
}
