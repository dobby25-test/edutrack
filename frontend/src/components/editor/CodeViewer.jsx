// frontend/src/components/editor/CodeViewer.jsx
// Read-only Monaco editor for teachers to review submitted code
// Drop this inside GradingModal.jsx replacing the <pre><code> block

import Editor from '@monaco-editor/react';

const LANG_MAP = {
  java:       'java',
  python:     'python',
  javascript: 'javascript',
  js:         'javascript',
  cpp:        'cpp',
  'c++':      'cpp',
  c:          'c',
  html:       'html',
  sql:        'sql',
};

export default function CodeViewer({ code = '', language = 'java', height = '400px' }) {
  const monacoLang = LANG_MAP[language?.toLowerCase()] || 'plaintext';

  if (!code?.trim()) {
    return (
      <div style={{
        height, background: '#1e1e2e',
        borderRadius: 8, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{ color: '#6c7086', fontSize: 13 }}>No code submitted</p>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Lang badge */}
      <div style={{
        background: '#181825', padding: '6px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#89b4fa',
          fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {monacoLang}
        </span>
        <span style={{ fontSize: 11, color: '#6c7086' }}>
          {code.split('\n').length} lines · {code.length} chars
        </span>
      </div>

      <Editor
        height={height}
        language={monacoLang}
        value={code}
        theme="vs-dark"
        options={{
          readOnly:             true,
          fontSize:             13,
          fontFamily:           "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures:        true,
          minimap:              { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers:          'on',
          folding:              true,
          automaticLayout:      true,
          padding:              { top: 12, bottom: 12 },
          bracketPairColorization: { enabled: true },
          renderLineHighlight:  'none',
          domReadOnly:          true,
          cursorStyle:          'underline',
          scrollbar:            { verticalScrollbarSize: 6 },
        }}
      />
    </div>
  );
}