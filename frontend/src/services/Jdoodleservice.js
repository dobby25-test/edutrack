// frontend/src/services/jdoodleService.js
// JDoodle execution is proxied via backend to avoid browser CORS and key exposure.

import api from './api';

export const JDOODLE_LANGUAGES = {
  java: { language: 'java', versionIndex: '4', label: 'Java 17', icon: 'Java', runnable: true },
  python: { language: 'python3', versionIndex: '4', label: 'Python 3.11', icon: 'Py', runnable: true },
  javascript: { language: 'nodejs', versionIndex: '4', label: 'Node.js 18', icon: 'JS', runnable: true },
  cpp: { language: 'cpp17', versionIndex: '1', label: 'C++ 17', icon: 'C++', runnable: true },
  c: { language: 'c', versionIndex: '5', label: 'C (GCC 9.1)', icon: 'C', runnable: true },
  php: { language: 'php', versionIndex: '4', label: 'PHP 8.1', icon: 'PHP', runnable: true },
  ruby: { language: 'ruby', versionIndex: '4', label: 'Ruby 3.1', icon: 'RB', runnable: true },
  go: { language: 'go', versionIndex: '4', label: 'Go 1.19', icon: 'Go', runnable: true },
  rust: { language: 'rust', versionIndex: '4', label: 'Rust 1.65', icon: 'Rs', runnable: true },
  kotlin: { language: 'kotlin', versionIndex: '3', label: 'Kotlin 1.7', icon: 'Kt', runnable: true },
  swift: { language: 'swift', versionIndex: '4', label: 'Swift 5.7', icon: 'Sw', runnable: true },
  sql: { language: 'sql', versionIndex: '4', label: 'SQL (SQLite)', icon: 'SQL', runnable: true },
  html: { language: null, versionIndex: null, label: 'HTML', icon: 'HTML', runnable: false }
};

export const runCode = async (code, language, stdin = '', onStatus) => {
  const lang = JDOODLE_LANGUAGES[language];

  if (!lang || !lang.runnable || !lang.language) {
    return {
      success: false,
      output: '',
      error: `${(language || 'unknown').toUpperCase()} cannot be executed. For HTML, use preview.`,
      memory: null,
      cpuTime: null,
      statusCode: 1
    };
  }

  onStatus?.('Sending code...');

  try {
    const response = await api.post('/projects/execute', {
      code,
      language,
      stdin: stdin || ''
    });

    onStatus?.('Processing...');

    const data = response.data || {};
    return {
      success: Boolean(data.success),
      output: data.output || '',
      error: data.error || '',
      memory: data.memory ?? null,
      cpuTime: data.cpuTime ?? null,
      statusCode: data.statusCode ?? (data.success ? 200 : 1)
    };
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Execution failed';
    return {
      success: false,
      output: '',
      error: message,
      memory: null,
      cpuTime: null,
      statusCode: err.response?.status || 1
    };
  }
};

export const checkCredits = async () => {
  try {
    const response = await api.get('/projects/execute/credits');
    const data = response.data || {};
    return {
      used: Number(data.used) || 0,
      limit: Number(data.limit) || 200,
      scope: data.scope || 'jdoodle_global'
    };
  } catch {
    return { used: 0, limit: 200, scope: 'jdoodle_global' };
  }
};
