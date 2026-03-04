// ═══════════════════════════════════════════════════════════════════════════
// FILE 2: frontend/src/components/auth/DirectorSignup.jsx
// CREATE this new file
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import { applyTheme, getInitialTheme, toggleTheme } from '../../utils/theme';

export default function DirectorSignup() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme);
  const [step, setStep] = useState(1); // 1: Access Code, 2: Registration Form
  const [form, setForm] = useState({
    accessCode: '',
    collegeName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => setTheme((prev) => toggleTheme(prev));

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setError('');
  };

  // Step 1: Verify Access Code
  const verifyAccessCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.accessCode.trim()) {
      setError('Please enter your access code');
      return;
    }

    setLoading(true);
    try {
      // Verify access code with backend
      await api.post('/auth/verify-access-code', { accessCode: form.accessCode });
      setStep(2); // Move to registration form
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.collegeName || !form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
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
      const res = await api.post('/auth/register-director', {
        accessCode: form.accessCode,
        collegeName: form.collegeName,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
      });

      const { token, user } = res.data;
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
      <div className="signup-page">
        
        <div className="signup-container">
          
          {/* Header */}
          <div className="signup-header">
            <button className="back-btn" onClick={() => navigate('/login')}>
              ← Back to Login
            </button>
            <div className="logo">
              <div className="logo-icon">E</div>
              <span>EduTrack</span>
            </div>
            <button type="button" className="theme-toggle-btn" onClick={handleToggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Access Code</span>
            </div>
            <div className="progress-line" />
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Institution Details</span>
            </div>
          </div>

          {/* Content */}
          <div className="signup-content">
            
            {step === 1 ? (
              /* Step 1: Access Code */
              <div className="step-content">
                <h2 className="step-title">Enter Your Access Code</h2>
                <p className="step-subtitle">
                  Use the access code provided when you purchased EduTrack
                </p>

                {error && (
                  <div className="error-alert">
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={verifyAccessCode}>
                  <div className="input-group">
                    <label className="input-label">Access Code</label>
                    <input
                      type="text"
                      className="input-field code-input"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={form.accessCode}
                      onChange={e => set('accessCode', e.target.value.toUpperCase())}
                      maxLength={19}
                      autoFocus
                    />
                    <p className="input-hint">
                      Enter the 16-character code sent to your email
                    </p>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                      <><span className="btn-spinner" />Verifying...</>
                    ) : (
                      <>Continue →</>
                    )}
                  </button>
                </form>

                <div className="help-box">
                  <strong>Don't have an access code?</strong>
                  <p>Contact our sales team at <a href="mailto:sales@edutrack.com">sales@edutrack.com</a> to purchase a license for your institution.</p>
                </div>
              </div>

            ) : (
              /* Step 2: Registration Form */
              <div className="step-content">
                <h2 className="step-title">Institution Registration</h2>
                <p className="step-subtitle">
                  Create your administrator account
                </p>

                {error && (
                  <div className="error-alert">
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  
                  {/* College Name */}
                  <div className="input-group">
                    <label className="input-label">Institution Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ABC College of Technology"
                      value={form.collegeName}
                      onChange={e => set('collegeName', e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Name + Email */}
                  <div className="input-row">
                    <div className="input-group">
                      <label className="input-label">Your Full Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Dr. John Doe"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email Address *</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="director@college.edu"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password + Confirm */}
                  <div className="input-row">
                    <div className="input-group">
                      <label className="input-label">Password *</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Confirm Password *</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="input-group">
                    <label className="input-label">Institution Address</label>
                    <textarea
                      className="input-field"
                      placeholder="Full address..."
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="back-btn-form"
                      onClick={() => setStep(1)}
                    >
                      ← Back
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? (
                        <><span className="btn-spinner" />Creating Account...</>
                      ) : (
                        <>Create Account</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="signup-footer">
            <p>By registering, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
          </div>

        </div>

      </div>
    </>
  );
}

// ─── CSS ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  .signup-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    font-family: 'Inter', sans-serif;
  }

  .signup-container {
    width: 100%;
    max-width: 700px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    overflow: hidden;
  }

  /* Header */
  .signup-header {
    padding: 24px 32px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .back-btn {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #111827;
  }

  .theme-toggle-btn {
    background: #fff;
    border: 1px solid #d1d5db;
    color: #4b5563;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
  }
  .theme-toggle-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    border-radius: 8px;
  }

  .logo span {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  /* Progress Steps */
  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    gap: 20px;
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    transition: all 0.3s;
  }

  .progress-step.active .step-number {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .progress-step span {
    font-size: 13px;
    color: #9ca3af;
  }

  .progress-step.active span {
    color: #111827;
    font-weight: 500;
  }

  .progress-line {
    width: 80px;
    height: 2px;
    background: #e5e7eb;
  }

  /* Content */
  .signup-content {
    padding: 32px;
  }

  .step-content {
    max-width: 600px;
    margin: 0 auto;
  }

  .step-title {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }

  .step-subtitle {
    font-size: 15px;
    color: #6b7280;
    margin-bottom: 32px;
  }

  /* Error Alert */
  .error-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 14px;
    color: #dc2626;
  }

  /* Input Groups */
  .input-group {
    margin-bottom: 20px;
  }

  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .input-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .input-field {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    font-size: 15px;
    color: #111827;
    transition: all 0.2s;
    font-family: inherit;
  }

  .input-field:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .input-field::placeholder {
    color: #d1d5db;
  }

  textarea.input-field {
    resize: vertical;
    min-height: 80px;
  }

  .code-input {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    text-align: center;
    font-weight: 600;
  }

  .input-hint {
    margin-top: 6px;
    font-size: 13px;
    color: #9ca3af;
  }

  /* Submit Button */
  .submit-btn {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Help Box */
  .help-box {
    margin-top: 24px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .help-box strong {
    display: block;
    font-size: 14px;
    color: #111827;
    margin-bottom: 6px;
  }

  .help-box p {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
  }

  .help-box a {
    color: #667eea;
    text-decoration: none;
  }

  .help-box a:hover {
    text-decoration: underline;
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  .back-btn-form {
    padding: 14px 24px;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn-form:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }

  .form-actions .submit-btn {
    flex: 1;
  }

  /* Footer */
  .signup-footer {
    padding: 20px 32px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .signup-footer p {
    font-size: 13px;
    color: #9ca3af;
  }

  .signup-footer a {
    color: #667eea;
    text-decoration: none;
  }

  .signup-footer a:hover {
    text-decoration: underline;
  }

  [data-auth-theme='dark'] .signup-page {
    background: linear-gradient(135deg, #0b1220 0%, #101828 55%, #07110d 100%);
  }
  [data-auth-theme='dark'] .signup-container {
    background: #0f172a;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    border: 1px solid #1f2937;
  }
  [data-auth-theme='dark'] .signup-header,
  [data-auth-theme='dark'] .signup-footer {
    border-color: #1f2937;
  }
  [data-auth-theme='dark'] .back-btn,
  [data-auth-theme='dark'] .progress-step span,
  [data-auth-theme='dark'] .step-subtitle,
  [data-auth-theme='dark'] .input-hint,
  [data-auth-theme='dark'] .help-box p,
  [data-auth-theme='dark'] .signup-footer p {
    color: #94a3b8;
  }
  [data-auth-theme='dark'] .logo span,
  [data-auth-theme='dark'] .step-title,
  [data-auth-theme='dark'] .progress-step.active span,
  [data-auth-theme='dark'] .input-label,
  [data-auth-theme='dark'] .help-box strong {
    color: #e2e8f0;
  }
  [data-auth-theme='dark'] .logo-icon,
  [data-auth-theme='dark'] .progress-step.active .step-number,
  [data-auth-theme='dark'] .submit-btn {
    background: linear-gradient(135deg, #2563eb 0%, #2cff8f 100%);
  }
  [data-auth-theme='dark'] .step-number,
  [data-auth-theme='dark'] .progress-line {
    background: #1f2937;
    color: #64748b;
  }
  [data-auth-theme='dark'] .input-field {
    background: #111827;
    border-color: #334155;
    color: #e2e8f0;
  }
  [data-auth-theme='dark'] .input-field::placeholder {
    color: #64748b;
  }
  [data-auth-theme='dark'] .input-field:focus {
    border-color: #2cff8f;
    box-shadow: 0 0 0 3px rgba(44, 255, 143, 0.18);
  }
  [data-auth-theme='dark'] .error-alert {
    background: rgba(127, 29, 29, 0.3);
    border-color: #7f1d1d;
    color: #fca5a5;
  }
  [data-auth-theme='dark'] .help-box {
    background: #111827;
    border-color: #334155;
  }
  [data-auth-theme='dark'] .help-box a,
  [data-auth-theme='dark'] .signup-footer a {
    color: #93c5fd;
  }
  [data-auth-theme='dark'] .back-btn-form {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
  }
  [data-auth-theme='dark'] .back-btn-form:hover {
    background: #1e293b;
    border-color: #475569;
  }
  [data-auth-theme='dark'] .theme-toggle-btn {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;
  }
  [data-auth-theme='dark'] .theme-toggle-btn:hover {
    color: #2cff8f;
    border-color: #2cff8f;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .input-row {
      grid-template-columns: 1fr;
    }

    .signup-content {
      padding: 24px 20px;
    }

    .progress-line {
      width: 40px;
    }
  }
`;



