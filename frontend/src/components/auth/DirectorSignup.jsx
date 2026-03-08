import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import useGlobalTheme from '../../hooks/useGlobalTheme';

export default function DirectorSignup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useGlobalTheme();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    accessCode: '',
    collegeName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const verifyAccessCode = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.accessCode.trim()) {
      setError('Please enter access code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-access-code', { accessCode: form.accessCode.trim() });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.collegeName || !form.name || !form.email || !form.password) {
      setError('Please fill all required fields');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register-director', {
        accessCode: form.accessCode,
        collegeName: form.collegeName,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address
      });

      const { token, user } = response.data;
      authService.setToken(token);
      authService.setUser(user);
      navigate('/director/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className={`ds-page ${theme}`}>
        <div className="ds-card">
          <div className="ds-head">
            <button type="button" className="ds-btn-link" onClick={() => navigate('/login')}>Back to Login</button>
            <h1>Director Signup</h1>
            <button type="button" className="ds-btn-link" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          <div className="ds-steps">
            <span className={step >= 1 ? 'active' : ''}>1. Access Code</span>
            <span className={step >= 2 ? 'active' : ''}>2. Director Details</span>
          </div>

          {error ? <p className="ds-error">{error}</p> : null}

          {step === 1 ? (
            <form onSubmit={verifyAccessCode} className="ds-form">
              <label>Access Code</label>
              <input
                type="text"
                value={form.accessCode}
                onChange={(e) => setField('accessCode', e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                autoFocus
              />
              <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Continue'}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="ds-form">
              <label>Institution Name *</label>
              <input type="text" value={form.collegeName} onChange={(e) => setField('collegeName', e.target.value)} />

              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} />

              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />

              <label>Password *</label>
              <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} />

              <label>Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} />

              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />

              <label>Address</label>
              <textarea rows={3} value={form.address} onChange={(e) => setField('address', e.target.value)} />

              <div className="ds-actions">
                <button type="button" className="secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const css = `
  .ds-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: #0a0e27;
    color: #e8eaed;
    font-family: 'Outfit', sans-serif;
  }

  .ds-page.light {
    background: #eef3ff;
    color: #0f172a;
  }

  .ds-card {
    width: min(640px, 100%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    background: rgba(20, 24, 53, 0.88);
    padding: 20px;
  }

  .ds-page.light .ds-card {
    background: #fff;
    border-color: rgba(15, 23, 42, 0.14);
  }

  .ds-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .ds-head h1 {
    margin: 0;
    font-size: 20px;
  }

  .ds-btn-link {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: inherit;
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 12px;
  }

  .ds-page.light .ds-btn-link {
    border-color: rgba(15, 23, 42, 0.2);
  }

  .ds-steps {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
    font-size: 13px;
    color: #9ca3af;
  }

  .ds-page.light .ds-steps {
    color: #64748b;
  }

  .ds-steps .active {
    color: #66a3ff;
    font-weight: 600;
  }

  .ds-page.light .ds-steps .active {
    color: #1d4ed8;
  }

  .ds-error {
    margin: 0 0 12px;
    color: #ff8aa2;
    font-size: 13px;
  }

  .ds-page.light .ds-error {
    color: #b91c1c;
  }

  .ds-form {
    display: grid;
    gap: 8px;
  }

  .ds-form label {
    font-size: 13px;
    color: #9ca3af;
  }

  .ds-page.light .ds-form label {
    color: #475569;
  }

  .ds-form input,
  .ds-form textarea {
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(30, 36, 69, 0.85);
    color: #e8eaed;
    border-radius: 8px;
    padding: 10px;
  }

  .ds-page.light .ds-form input,
  .ds-page.light .ds-form textarea {
    border-color: rgba(15, 23, 42, 0.16);
    background: #fff;
    color: #0f172a;
  }

  .ds-form button {
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 10px;
    background: #0066ff;
    color: #fff;
    cursor: pointer;
    font-weight: 600;
  }

  .ds-form button.secondary {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.18);
    color: inherit;
  }

  .ds-page.light .ds-form button.secondary {
    border-color: rgba(15, 23, 42, 0.2);
  }

  .ds-actions {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 8px;
    margin-top: 6px;
  }
`;
