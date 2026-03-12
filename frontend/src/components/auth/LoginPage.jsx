import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import { isValidEmail, sanitizeInput } from '../../utils/sanitize';
import useGlobalTheme from '../../hooks/useGlobalTheme';
import './loginPage.css';

const ROLE_ROUTES = {
  director: '/director/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard'
};

function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useGlobalTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    return Boolean(form.email.trim() && form.password.trim());
  }, [form.email, form.password]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const email = sanitizeInput(form.email).toLowerCase();
    const password = sanitizeInput(form.password);

    if (!email || !password) {
      setError('Enter both email and password.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;

      authService.setToken(token);
      if (refreshToken) authService.setRefreshToken(refreshToken);
      authService.setUser(user);

      navigate(ROLE_ROUTES[user.role] || ROLE_ROUTES.student);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${theme}`}>
      <div className="login-glow login-glow-a" />
      <div className="login-glow login-glow-b" />

      <div className="login-wrap">
        <aside className="login-side">
          <p className="login-eyebrow">EduTrack Access Portal</p>
          <h1>
            Focused dashboard UX
            <span> for every academic role.</span>
          </h1>
          <p className="login-lead">
            Sign in to manage assignments, submissions, and analytics in one clean workflow.
          </p>

          <div className="login-side-grid">
            <article>
              <strong>Student</strong>
              <p>Track status, submit code, and view marks.</p>
            </article>
            <article>
              <strong>Teacher</strong>
              <p>Create projects, review submissions, export reports.</p>
            </article>
            <article>
              <strong>Director</strong>
              <p>Monitor departments, trends, and performance.</p>
            </article>
          </div>
        </aside>

        <section className="login-card">
          <div className="login-top-row">
            <Link className="login-back" to="/">
              Back to Landing
            </Link>
            <button className="login-theme-btn" type="button" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          <h2>Welcome back</h2>
          <p>Use your institution credentials to continue.</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              placeholder="you@college.edu"
              autoComplete="email"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
              autoFocus
            />

            <label htmlFor="password">Password</label>
            <div className="login-password-row">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
              <button
                className="login-toggle-pw"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="login-links">
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/director-signup">Director signup</Link>
            </div>

            <button className="login-submit" type="submit" disabled={!canSubmit || loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="sr-only" id="login-error" aria-live="polite">{error}</p>
          </form>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
