// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// frontend/src/components/auth/AuthPages.jsx
// Contains: Login, Register, ForgotPassword â€” all in one file
// Import whichever you need in App.jsx
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import useGlobalTheme from '../../hooks/useGlobalTheme';
import { sanitizeInput, isValidEmail, validatePassword } from '../../utils/sanitize';

function useAuthTheme() {
  const { theme, toggleTheme } = useGlobalTheme();
  return { theme, toggleTheme };
}

// â”€â”€â”€ Shared CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const sharedCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:     #1A1A1A;
    --paper:   #FAFAFA;
    --accent:  #FFD000;
    --accent-dark: #1A1A1A;
    --mid:     #6B7280;
    --border:  rgba(0, 0, 0, 0.08);
    --success: #10B981;
    --danger:  #EF4444;
  }

  body { font-family: 'Inter', sans-serif; background: var(--paper); color: var(--ink); }

  /* â”€â”€ Layout Split â”€â”€ */
  .auth-shell {
    min-height: 100vh; display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* â”€â”€ Left Panel â”€â”€ */
  .auth-left {
    background: var(--accent);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px; position: relative; overflow: hidden;
  }
  .auth-left-bg {
    position: absolute; inset: 0; pointer-events: none;
  }
  .auth-left-bg::before {
    content: ''; position: absolute;
    top: -15%; right: -10%;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(26, 26, 26, 0.08);
  }
  .auth-left-bg::after {
    content: ''; position: absolute;
    bottom: 5%; left: -5%;
    width: 250px; height: 250px;
    background: rgba(26, 26, 26, 0.05);
    border-radius: 50%;
  }

  .auth-brand { position: relative; z-index: 1; }
  .auth-brand-mark {
    display: inline-flex; align-items: center; gap: 12px;
    text-decoration: none;
  }
  .auth-brand-box {
    width: 48px; height: 48px; background: var(--accent-dark);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Space Grotesk', sans-serif; font-size: 24px;
    font-weight: 700; color: var(--accent); border-radius: 12px;
  }
  .auth-brand-text {
    font-family: 'Space Grotesk', sans-serif; font-size: 24px;
    font-weight: 700; color: var(--accent-dark); letter-spacing: -0.02em;
  }

  .auth-left-copy { position: relative; z-index: 1; }
  .auth-left-headline {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(36px, 4.5vw, 56px);
    font-weight: 700; color: var(--accent-dark);
    line-height: 1.1; letter-spacing: -0.03em;
    margin-bottom: 24px;
  }
  .auth-left-headline span { color: var(--accent-dark); text-decoration: underline; text-decoration-color: var(--accent-dark); text-underline-offset: 4px; }
  .auth-left-sub {
    font-size: 16px; color: rgba(26, 26, 26, 0.7);
    line-height: 1.7; max-width: 340px;
  }

  .auth-left-stats {
    display: flex; gap: 32px; position: relative; z-index: 1;
  }
  .stat-block { }
  .stat-num {
    font-family: 'Space Grotesk', sans-serif; font-size: 32px;
    font-weight: 700; color: var(--accent-dark);
  }
  .stat-lbl { font-size: 12px; color: rgba(26, 26, 26, 0.6);
    text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; font-weight: 500; }

  /* â”€â”€ Right Panel â”€â”€ */
  .auth-right {
    display: flex; align-items: center; justify-content: center;
    padding: 48px 40px; background: var(--paper);
  }
  .auth-form-wrap { width: 100%; max-width: 400px; }
  .theme-switch-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
  .theme-toggle {
    border: 1px solid var(--border);
    background: transparent;
    color: var(--mid);
    font-family: 'Epilogue', sans-serif;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 7px 10px;
    cursor: pointer;
  }
  .theme-toggle:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .auth-form-title {
    font-family: 'Space Grotesk', sans-serif; font-size: 32px;
    font-weight: 700; color: var(--ink); margin-bottom: 8px;
    letter-spacing: -0.02em;
  }
  .auth-form-sub {
    font-size: 14px; color: var(--mid); margin-bottom: 36px; line-height: 1.5;
  }
  .auth-form-sub a { color: var(--ink); font-weight: 600; text-decoration: none; }
  .auth-form-sub a:hover { color: var(--accent); }

  /* â”€â”€ Form Fields â”€â”€ */
  .field-group { margin-bottom: 20px; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field-label {
    display: block; font-size: 11px; font-weight: 600;
    color: var(--mid); text-transform: uppercase;
    letter-spacing: 0.09em; margin-bottom: 8px;
  }
  .field-input {
    width: 100%; padding: 14px 16px;
    border: 2px solid var(--border); border-radius: 12px;
    background: #fff; color: var(--ink);
    font-family: 'Inter', sans-serif; font-size: 15px;
    transition: all 0.2s ease;
    -webkit-appearance: none;
  }
  .field-input:focus {
    outline: none; border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(255, 208, 0, 0.15);
  }
  .field-input.error { border-color: var(--danger); }
  .field-input::placeholder { color: var(--mid); }

  .field-select {
    width: 100%; padding: 14px 16px;
    border: 2px solid var(--border); border-radius: 12px;
    background: #fff; color: var(--ink);
    font-family: 'Inter', sans-serif; font-size: 15px;
    cursor: pointer; transition: all 0.2s ease;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231A1A1A' stroke-width='1.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
  }
  .field-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px rgba(255, 208, 0, 0.15); }

  /* â”€â”€ Password Toggle â”€â”€ */
  .field-pw-wrap { position: relative; }
  .field-pw-wrap .field-input { padding-right: 44px; }
  .pw-toggle {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--mid); font-size: 16px; padding: 4px;
    transition: color 0.15s;
  }
  .pw-toggle:hover { color: var(--ink); }

  /* â”€â”€ Error / Success Banners â”€â”€ */
  .auth-error {
    background: #FEF2F2; border: 2px solid var(--danger);
    color: #DC2626; padding: 14px 16px;
    font-size: 14px; margin-bottom: 20px; border-radius: 12px;
    display: flex; align-items: center; gap: 10px; font-weight: 500;
  }
  .auth-success {
    background: #ECFDF5; border: 2px solid var(--success);
    color: #059669; padding: 14px 16px;
    font-size: 14px; margin-bottom: 20px; border-radius: 12px;
    display: flex; align-items: center; gap: 10px; font-weight: 500;
  }

  /* â”€â”€ Submit Button â”€â”€ */
  .auth-btn {
    width: 100%; padding: 16px;
    background: var(--accent); color: var(--accent-dark);
    border: none; cursor: pointer; border-radius: 12px;
    font-family: 'Inter', sans-serif; font-size: 15px;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-top: 12px;
  }
  .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255, 208, 0, 0.35); }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* â”€â”€ Divider â”€â”€ */
  .auth-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 24px 0; color: var(--border);
  }
  .auth-divider::before, .auth-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }
  .auth-divider span { font-size: 11px; color: var(--mid); white-space: nowrap; }

  /* â”€â”€ Role Pills â”€â”€ */
  .role-pills { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
  .role-pill {
    padding: 16px 12px; border: 2px solid var(--border);
    background: #fff; cursor: pointer; text-align: center;
    transition: all 0.2s ease; border-radius: 12px;
  }
  .role-pill:hover { border-color: var(--accent); background: rgba(255, 208, 0, 0.05); }
  .role-pill.selected { border-color: var(--accent); background: var(--accent); }
  .role-pill-icon { font-size: 24px; display: block; margin-bottom: 6px; font-weight: 700; }
  .role-pill-label {
    font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--mid);
  }
  .role-pill.selected .role-pill-label { color: var(--accent-dark); }
  .role-pill.selected .role-pill-icon { color: var(--accent-dark); }

  /* â”€â”€ Spinner â”€â”€ */
  .auth-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(26,26,26,0.2);
    border-top-color: var(--accent-dark);
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* â”€â”€ Forgot Password link â”€â”€ */
  .forgot-link {
    display: block; text-align: right; font-size: 13px;
    color: var(--accent-dark); text-decoration: none; margin-top: -12px; margin-bottom: 20px;
    transition: all 0.2s ease; font-weight: 500;
  }
  .forgot-link:hover { color: var(--accent-dark); text-decoration: underline; }

  /* â”€â”€ Terms â”€â”€ */
  .auth-terms {
    font-size: 11px; color: var(--mid); margin-top: 16px;
    text-align: center; line-height: 1.6;
  }
  .auth-terms a { color: var(--ink); text-decoration: underline; }

  /* â”€â”€ Responsive â”€â”€ */
  @media (max-width: 768px) {
    .auth-shell { grid-template-columns: 1fr; }
    .auth-left { display: none; }
    .auth-right { padding: 32px 24px; }
    .field-row { grid-template-columns: 1fr; }
  }

  /* Light Theme (Default) */
  .auth-right {
    background: var(--paper);
  }
  
  .auth-form-wrap {
    border: 1px solid var(--border);
    background: #FFFFFF;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
    border-radius: 20px;
    padding: 32px;
  }
  
  .theme-toggle {
    background: transparent;
    border: 2px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    font-weight: 500;
    color: var(--mid);
  }
  
  .theme-toggle:hover {
    border-color: var(--accent);
    color: var(--accent-dark);
  }
  
  /* Dark Theme */
  [data-auth-theme='dark'] {
    --ink: #FAFAFA;
    --paper: #0F0F0F;
    --accent: #FFD000;
    --accent-dark: #1A1A1A;
    --mid: #A1A1AA;
    --border: rgba(255, 255, 255, 0.1);
  }
  
  [data-auth-theme='dark'] body {
    background: #0F0F0F;
    color: #FAFAFA;
  }
  
  [data-auth-theme='dark'] .auth-right {
    background: #0F0F0F;
  }
  
  [data-auth-theme='dark'] .auth-form-wrap {
    background: #1A1A1A;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }
  
  [data-auth-theme='dark'] .field-input,
  [data-auth-theme='dark'] .field-select {
    background: #252525;
    border-color: rgba(255, 255, 255, 0.1);
    color: #FAFAFA;
  }
  
  [data-auth-theme='dark'] .field-input::placeholder {
    color: #71717A;
  }
  
  [data-auth-theme='dark'] .role-pill {
    background: #252525;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  [data-auth-theme='dark'] .role-pill-label {
    color: #A1A1AA;
  }
  
  [data-auth-theme='dark'] .auth-form-title,
  [data-auth-theme='dark'] .auth-form-sub {
    color: #FAFAFA;
  }
  
  [data-auth-theme='dark'] .field-label {
    color: #A1A1AA;
  }
  
  [data-auth-theme='dark'] .theme-toggle {
    border-color: rgba(255, 255, 255, 0.1);
    color: #A1A1AA;
  }
  
  [data-auth-theme='dark'] .theme-toggle:hover {
    border-color: var(--accent);
  }
  
  [data-auth-theme='dark'] .pw-toggle {
    color: #A1A1AA;
    border-color: rgba(255, 255, 255, 0.1);
  }
`;
// â”€â”€â”€ Left Panel (shared) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LeftPanel({ headline, sub }) {
  return (
    <div className="auth-left">
      <div className="auth-left-bg" />
      <div className="auth-brand">
        <a href="/" className="auth-brand-mark">
          <div className="auth-brand-box">E</div>
          <span className="auth-brand-text">EduTrack</span>
        </a>
      </div>
      <div className="auth-left-copy">
        <h1 className="auth-left-headline" dangerouslySetInnerHTML={{ __html: headline }} />
        <p className="auth-left-sub">{sub}</p>
      </div>
      <div className="auth-left-stats">
        <div className="stat-block">
          <div className="stat-num">500+</div>
          <div className="stat-lbl">Students</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">40+</div>
          <div className="stat-lbl">Teachers</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">200+</div>
          <div className="stat-lbl">Projects</div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useAuthTheme();

  return (
    <div className="theme-switch-row">
      <button type="button" className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOGIN PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const sanitizedEmail = sanitizeInput(form.email).toLowerCase();
    const sanitizedPassword = sanitizeInput(form.password);

    if (!sanitizedEmail || !sanitizedPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(sanitizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: sanitizedEmail,
        password: sanitizedPassword
      });
      const { token, refreshToken, user } = res.data;

      authService.setToken(token);
      if (refreshToken) authService.setRefreshToken(refreshToken);
      authService.setUser(user);

      // Role-based redirect
      const routes = {
        director: '/director/dashboard',
        teacher:  '/teacher/dashboard',
        student:  '/student/dashboard',
      };
      navigate(routes[user.role] || '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{sharedCss}</style>
      <div className="auth-shell">
        <LeftPanel
          headline="Learn.<br/><span>Build.</span><br/>Grow."
          sub="A unified platform for students, teachers, and directors to manage academic projects."
        />

        <div className="auth-right">
          <div className="auth-form-wrap">
            <ThemeToggleButton />
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-sub">
              Use your institution-issued credentials to sign in.
            </p>

            {error && (
              <div className="auth-error">
                <span>!</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className={`field-input ${error ? 'error' : ''}`}
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="field-pw-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`field-input ${error ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" className="pw-toggle"
                    onClick={() => setShowPw(s => !s)}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REGISTER PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', department: '',
  });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFE]    = useState({});
  const [passwordErrors, setPasswordErrors] = useState([]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFE(fe => ({ ...fe, [k]: '' }));
    if (k === 'password') {
      const validation = validatePassword(v);
      setPasswordErrors(validation.errors);
    }
  };

  const validate = () => {
    const errs = {};
    const safeName = sanitizeInput(form.name);
    const safeEmail = sanitizeInput(form.email).toLowerCase();
    const safeDepartment = sanitizeInput(form.department);
    const passwordValidation = validatePassword(form.password);

    if (!safeName) errs.name = true;
    if (!isValidEmail(safeEmail)) errs.email = true;
    if (!passwordValidation.isValid) errs.password = true;
    if (form.password !== form.confirmPassword) errs.confirmPassword = true;
    if (!safeDepartment) errs.department = true;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setFE(errs);
      setError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        name: sanitizeInput(form.name),
        email: sanitizeInput(form.email).toLowerCase(),
        department: sanitizeInput(form.department),
        password: sanitizeInput(form.password),
        role: sanitizeInput(form.role).toLowerCase()
      };
      delete payload.confirmPassword;
      const res = await api.post('/auth/register', payload);
      const { token, refreshToken, user } = res.data;

      authService.setToken(token);
      if (refreshToken) authService.setRefreshToken(refreshToken);
      authService.setUser(user);

      const routes = {
        director: '/director/dashboard',
        teacher:  '/teacher/dashboard',
        student:  '/student/dashboard',
      };
      navigate(routes[user.role] || '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student',  label: 'Student',  icon: 'S' },
    { value: 'teacher',  label: 'Teacher',  icon: 'T' },
    { value: 'director', label: 'Director', icon: 'D' },
  ];

  const departments = [
    'Computer Science', 'BCA', 'BBA', 'Commerce',
    'Science', 'Arts', 'Engineering', 'Administration',
  ];

  return (
    <>
      <style>{sharedCss}</style>
      <div className="auth-shell">
        <LeftPanel
          headline="Join<br/><span>EduTrack</span><br/>Today."
          sub="Create your account and start managing your academic journey from day one."
        />

        <div className="auth-right">
          <div className="auth-form-wrap">
            <ThemeToggleButton />
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-sub">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>

            {error && (
              <div className="auth-error">
                <span>!</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role selector */}
              <div className="field-group">
                <label className="field-label">I am a...</label>
                <div className="role-pills">
                  {roles.map(r => (
                    <div key={r.value}
                      className={`role-pill ${form.role === r.value ? 'selected' : ''}`}
                      onClick={() => set('role', r.value)}>
                      <span className="role-pill-icon">{r.icon}</span>
                      <span className="role-pill-label">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name + Dept */}
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input type="text"
                    className={`field-input ${fieldErrors.name ? 'error' : ''}`}
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Department</label>
                  <select
                    className={`field-select ${fieldErrors.department ? 'error' : ''}`}
                    value={form.department}
                    onChange={e => set('department', e.target.value)}>
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input type="email"
                  className={`field-input ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                />
              </div>

              {/* Passwords */}
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="field-pw-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={`field-input ${fieldErrors.password ? 'error' : ''}`}
                      placeholder="Min 6 chars"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                    />
                    <button type="button" className="pw-toggle"
                      onClick={() => setShowPw(s => !s)}>
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Confirm</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`field-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                  />
                </div>
              </div>

              {/* Password strength */}
              {form.password && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px',
                        background: i <= (
                          form.password.length >= 10 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 :
                          form.password.length >= 8 ? 3 :
                          form.password.length >= 6 ? 2 : 1
                        ) ? (
                          form.password.length < 6 ? '#e63329' :
                          form.password.length < 8 ? '#f5a623' :
                          form.password.length < 10 ? '#2471a3' : '#1a7a4a'
                        ) : '#e0deda',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--mid)' }}>
                    {form.password.length < 6 ? 'Too short' :
                     form.password.length < 8 ? 'Weak' :
                     form.password.length < 10 ? 'Good' : 'Strong'} password
                  </p>
                </div>
              )}
              {/* ✅ SECURITY FIX: Explicit password policy feedback before submit. */}
              {passwordErrors.length > 0 && (
                <div className="auth-error" style={{ marginBottom: '12px' }}>
                  <span>!</span> {passwordErrors[0]}
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : null}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="auth-terms">
              By registering you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORGOT PASSWORD PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const safeEmail = sanitizeInput(email).toLowerCase();

    if (!isValidEmail(safeEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: safeEmail });
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{sharedCss}</style>
      <div className="auth-shell">
        <LeftPanel
          headline="Reset<br/>your<br/><span>password.</span>"
          sub="Enter your email and we'll send you a secure link to reset your password."
        />

        <div className="auth-right">
          <div className="auth-form-wrap">
            <ThemeToggleButton />
            {!sent ? (
              <>
                <h2 className="auth-form-title">Forgot password?</h2>
                <p className="auth-form-sub">
                  Remembered it?{' '}
                  <Link to="/login">Back to login</Link>
                </p>

                {error && (
                  <div className="auth-error">
                    <span>!</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label className="field-label">Email Address</label>
                    <input
                      type="email"
                      className="field-input"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : null}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '20px' }}>MAIL</div>
                <h2 className="auth-form-title" style={{ textAlign: 'center' }}>Check your inbox</h2>
                <p style={{ color: 'var(--mid)', fontSize: '14px', lineHeight: 1.7, marginTop: '12px', marginBottom: '32px' }}>
                  If an account exists for <strong>{email}</strong>, you'll receive a password reset link within a few minutes.
                </p>
                <div className="auth-success">
                  <span>OK</span> Reset link sent (check spam too)
                </div>
                <Link to="/login">
                  <button className="auth-btn" style={{ marginTop: '8px' }}>
                    Back to Login
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// â”€â”€â”€ Default export (Login) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const safePassword = sanitizeInput(password);
    const safeConfirm = sanitizeInput(confirmPassword);
    const validation = validatePassword(safePassword);
    setPasswordErrors(validation.errors);

    if (!validation.isValid) {
      setError(validation.errors[0] || 'Password does not meet policy requirements.');
      return;
    }

    if (safePassword !== safeConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: safePassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{sharedCss}</style>
      <div className="auth-shell">
        <LeftPanel
          headline="Create<br/>new<br/><span>password.</span>"
          sub="Set a new secure password for your account."
        />

        <div className="auth-right">
          <div className="auth-form-wrap">
            <ThemeToggleButton />
            {!success ? (
              <>
                <h2 className="auth-form-title">Reset password</h2>
                <p className="auth-form-sub">Enter your new password below.</p>

                {error && (
                  <div className="auth-error">
                    <span>!</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input
                      type="password"
                      className="field-input"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => {
                        const next = e.target.value;
                        setPassword(next);
                        setPasswordErrors(validatePassword(next).errors);
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Confirm Password</label>
                    <input
                      type="password"
                      className="field-input"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {passwordErrors.length > 0 && (
                    <div className="auth-error">
                      <span>!</span> {passwordErrors[0]}
                    </div>
                  )}

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : null}
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <h2 className="auth-form-title" style={{ textAlign: 'center' }}>Password updated</h2>
                <p style={{ color: 'var(--mid)', fontSize: '14px', lineHeight: 1.7, marginTop: '12px', marginBottom: '32px' }}>
                  Your password has been changed successfully.
                </p>
                <button className="auth-btn" onClick={() => navigate('/login')}>
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;





