// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// frontend/src/components/auth/AuthPages.jsx
// Contains: Login, Register, ForgotPassword â€” all in one file
// Import whichever you need in App.jsx
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';
import useGlobalTheme from '../../hooks/useGlobalTheme';

function useAuthTheme() {
  const { theme, toggleTheme } = useGlobalTheme();
  return { theme, toggleTheme };
}

// â”€â”€â”€ Shared CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const sharedCss = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500&family=Orbitron:wght@500;700;800&family=Share+Tech+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:     #111118;
    --paper:   #f7f6f2;
    --accent:  #e63329;
    --mid:     #6b6b7a;
    --border:  #d8d7d2;
    --success: #1a7a4a;
  }

  body { font-family: 'Epilogue', sans-serif; background: var(--paper); color: var(--ink); }

  /* â”€â”€ Layout Split â”€â”€ */
  .auth-shell {
    min-height: 100vh; display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* â”€â”€ Left Panel â”€â”€ */
  .auth-left {
    background: var(--ink);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px; position: relative; overflow: hidden;
  }
  .auth-left-bg {
    position: absolute; inset: 0; pointer-events: none;
  }
  .auth-left-bg::before {
    content: ''; position: absolute;
    top: -20%; right: -15%;
    width: 500px; height: 500px;
    border-radius: 50%;
    border: 80px solid rgba(230,51,41,0.12);
  }
  .auth-left-bg::after {
    content: ''; position: absolute;
    bottom: 10%; left: -10%;
    width: 300px; height: 300px;
    background: rgba(230,51,41,0.06);
    transform: rotate(45deg);
  }

  .auth-brand { position: relative; z-index: 1; }
  .auth-brand-mark {
    display: inline-flex; align-items: center; gap: 12px;
    text-decoration: none;
  }
  .auth-brand-box {
    width: 42px; height: 42px; background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 20px;
    font-weight: 800; color: #fff;
  }
  .auth-brand-text {
    font-family: 'Syne', sans-serif; font-size: 22px;
    font-weight: 700; color: #fff; letter-spacing: -0.3px;
  }

  .auth-left-copy { position: relative; z-index: 1; }
  .auth-left-headline {
    font-family: 'Syne', sans-serif;
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 800; color: #fff;
    line-height: 1.1; letter-spacing: -1px;
    margin-bottom: 20px;
  }
  .auth-left-headline span { color: var(--accent); }
  .auth-left-sub {
    font-size: 15px; color: rgba(255,255,255,0.5);
    line-height: 1.7; max-width: 340px;
  }

  .auth-left-stats {
    display: flex; gap: 32px; position: relative; z-index: 1;
  }
  .stat-block { }
  .stat-num {
    font-family: 'Syne', sans-serif; font-size: 26px;
    font-weight: 800; color: #fff;
  }
  .stat-lbl { font-size: 11px; color: rgba(255,255,255,0.4);
    text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; }

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
    font-family: 'Syne', sans-serif; font-size: 28px;
    font-weight: 800; color: var(--ink); margin-bottom: 8px;
    letter-spacing: -0.5px;
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
    width: 100%; padding: 12px 14px;
    border: 1.5px solid var(--border); border-radius: 0;
    background: #fff; color: var(--ink);
    font-family: 'Epilogue', sans-serif; font-size: 14px;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }
  .field-input:focus {
    outline: none; border-color: var(--ink);
  }
  .field-input.error { border-color: var(--accent); }
  .field-input::placeholder { color: #bbb; }

  .field-select {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid var(--border); border-radius: 0;
    background: #fff; color: var(--ink);
    font-family: 'Epilogue', sans-serif; font-size: 14px;
    cursor: pointer; transition: border-color 0.15s;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23111' stroke-width='1.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }
  .field-select:focus { outline: none; border-color: var(--ink); }

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
    background: #fef2f2; border: 1.5px solid var(--accent);
    color: var(--accent); padding: 12px 14px;
    font-size: 13px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .auth-success {
    background: #f0fdf4; border: 1.5px solid var(--success);
    color: var(--success); padding: 12px 14px;
    font-size: 13px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }

  /* â”€â”€ Submit Button â”€â”€ */
  .auth-btn {
    width: 100%; padding: 14px;
    background: var(--ink); color: #fff;
    border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px;
    font-weight: 700; letter-spacing: 0.04em;
    text-transform: uppercase;
    transition: background 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-top: 8px;
  }
  .auth-btn:hover:not(:disabled) { background: var(--accent); }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
  .role-pills { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
  .role-pill {
    padding: 10px 8px; border: 1.5px solid var(--border);
    background: #fff; cursor: pointer; text-align: center;
    transition: all 0.15s; border-radius: 0;
  }
  .role-pill:hover { border-color: var(--ink); }
  .role-pill.selected { border-color: var(--ink); background: var(--ink); }
  .role-pill-icon { font-size: 20px; display: block; margin-bottom: 4px; }
  .role-pill-label {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.07em; color: var(--mid);
  }
  .role-pill.selected .role-pill-label { color: #fff; }

  /* â”€â”€ Spinner â”€â”€ */
  .auth-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* â”€â”€ Forgot Password link â”€â”€ */
  .forgot-link {
    display: block; text-align: right; font-size: 12px;
    color: var(--mid); text-decoration: none; margin-top: -12px; margin-bottom: 20px;
    transition: color 0.15s;
  }
  .forgot-link:hover { color: var(--ink); }

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

  /* Neon hacking theme override */
  :root {
    --ink: #07110d;
    --paper: #020704;
    --accent: #2cff8f;
    --mid: #7bc9a2;
    --border: #134c32;
    --success: #35ffab;
  }
  body {
    font-family: 'Share Tech Mono', monospace;
    color: #d6ffe8;
    background:
      radial-gradient(circle at 18% 20%, rgba(44,255,143,0.07), transparent 40%),
      radial-gradient(circle at 80% 10%, rgba(44,255,143,0.06), transparent 34%),
      linear-gradient(140deg, #010402 0%, #031109 60%, #010503 100%) !important;
  }
  .auth-shell::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      rgba(44,255,143,0.02),
      rgba(44,255,143,0.02) 1px,
      transparent 1px,
      transparent 3px
    );
    mix-blend-mode: screen;
  }
  .auth-left {
    background: linear-gradient(145deg, #010502, #03130a) !important;
    border-right: 1px solid rgba(44,255,143,0.2);
  }
  .auth-left-bg::before {
    background:
      radial-gradient(circle at 75% 15%, rgba(44,255,143,0.2), transparent 38%),
      linear-gradient(120deg, transparent 40%, rgba(44,255,143,0.06) 70%, transparent 100%) !important;
  }
  .auth-brand-box {
    border: 1px solid var(--accent);
    background: rgba(44,255,143,0.08) !important;
    color: var(--accent) !important;
    box-shadow: 0 0 14px rgba(44,255,143,0.35);
    font-family: 'Orbitron', sans-serif !important;
  }
  .auth-brand-text, .auth-form-title, .auth-left-headline, .auth-btn {
    font-family: 'Orbitron', sans-serif !important;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .auth-left-headline, .auth-form-title { text-shadow: 0 0 16px rgba(44,255,143,0.28); }
  .auth-left-sub, .stat-lbl, .auth-form-sub, .auth-terms { color: #84efbc !important; }
  .stat-num { color: #bcffda !important; text-shadow: 0 0 10px rgba(44,255,143,0.3); }

  .auth-right {
    background:
      radial-gradient(circle at 92% 20%, rgba(44,255,143,0.08), transparent 30%),
      linear-gradient(180deg, #020a06 0%, #010604 100%) !important;
  }
  .auth-form-wrap {
    border: 1px solid rgba(44,255,143,0.28);
    background: rgba(2, 14, 8, 0.88) !important;
    box-shadow: 0 0 28px rgba(44,255,143,0.12), inset 0 0 0 1px rgba(44,255,143,0.1);
    padding: 28px;
  }
  .field-label {
    color: #8effc8 !important;
    letter-spacing: 0.12em;
  }
  .field-input, .field-select {
    background: rgba(4, 22, 14, 0.92) !important;
    border: 1px solid var(--border) !important;
    color: #d6ffe8 !important;
    font-family: 'Share Tech Mono', monospace !important;
  }
  .field-input::placeholder { color: rgba(132,255,192,0.45) !important; }
  .field-input:focus, .field-select:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 2px rgba(44,255,143,0.2), 0 0 18px rgba(44,255,143,0.2);
  }
  .field-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232cff8f' stroke-width='1.5'/%3E%3C/svg%3E") !important;
  }
  .pw-toggle {
    color: var(--accent) !important;
    border: 1px solid rgba(44,255,143,0.35);
    font-size: 11px;
    font-family: 'Share Tech Mono', monospace;
    padding: 4px 7px;
  }
  .pw-toggle:hover { background: rgba(44,255,143,0.1); }
  .auth-btn {
    border: 1px solid rgba(44,255,143,0.6) !important;
    background: linear-gradient(90deg, rgba(18,130,74,0.35), rgba(44,255,143,0.22)) !important;
    color: #d8ffe9 !important;
  }
  .auth-btn:hover:not(:disabled) { box-shadow: 0 0 24px rgba(44,255,143,0.35); transform: translateY(-1px); }
  .auth-divider::before, .auth-divider::after { background: rgba(44,255,143,0.25) !important; }
  .auth-divider span { color: #95efc0 !important; text-transform: uppercase; letter-spacing: 0.08em; }
  .role-pill {
    border: 1px solid rgba(44,255,143,0.25) !important;
    background: rgba(4, 24, 15, 0.85) !important;
  }
  .role-pill:hover { border-color: var(--accent) !important; box-shadow: 0 0 12px rgba(44,255,143,0.2); }
  .role-pill.selected { border-color: var(--accent) !important; background: rgba(44,255,143,0.16) !important; }
  .role-pill-label { color: #a0f3c6 !important; }
  .forgot-link {
    color: #8cf7be !important;
    text-decoration: none;
    letter-spacing: 0.03em;
  }
  .forgot-link:hover { color: #d4ffe8 !important; text-shadow: 0 0 12px rgba(44,255,143,0.45); }
  .auth-error {
    background: rgba(50, 8, 16, 0.8) !important;
    border-color: rgba(255,79,109,0.7) !important;
    color: #ff8aa2 !important;
  }
  .auth-success {
    background: rgba(6, 40, 22, 0.82) !important;
    border-color: rgba(49,255,159,0.6) !important;
    color: #9cffcd !important;
  }

  [data-auth-theme='light'] {
    --ink: #172033;
    --paper: #f3f5fb;
    --accent: #1d4ed8;
    --mid: #667085;
    --border: #d5dcec;
    --success: #15803d;
  }
  [data-auth-theme='light'] body {
    color: var(--ink);
    background: linear-gradient(140deg, #f3f5fb 0%, #e9eefb 100%) !important;
  }
  [data-auth-theme='light'] .auth-left {
    background: linear-gradient(145deg, #1e293b, #0f172a) !important;
    border-right: 1px solid rgba(15, 23, 42, 0.25);
  }
  [data-auth-theme='light'] .auth-right {
    background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%) !important;
  }
  [data-auth-theme='light'] .auth-form-wrap {
    background: #ffffff !important;
    border: 1px solid #e5e7eb;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  }
  [data-auth-theme='light'] .auth-form-title,
  [data-auth-theme='light'] .auth-brand-text,
  [data-auth-theme='light'] .auth-left-headline {
    text-shadow: none;
  }
  [data-auth-theme='light'] .auth-left-sub,
  [data-auth-theme='light'] .stat-lbl,
  [data-auth-theme='light'] .auth-form-sub,
  [data-auth-theme='light'] .auth-terms {
    color: #64748b !important;
  }
  [data-auth-theme='light'] .field-label {
    color: #475569 !important;
  }
  [data-auth-theme='light'] .field-input,
  [data-auth-theme='light'] .field-select {
    background: #ffffff !important;
    color: #0f172a !important;
    border: 1px solid #d5dcec !important;
    font-family: 'Epilogue', sans-serif !important;
  }
  [data-auth-theme='light'] .field-input::placeholder {
    color: #94a3b8 !important;
  }
  [data-auth-theme='light'] .field-input:focus,
  [data-auth-theme='light'] .field-select:focus {
    border-color: #1d4ed8 !important;
    box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.15);
  }
  [data-auth-theme='light'] .pw-toggle {
    color: #334155 !important;
    border: 1px solid #d5dcec;
    background: #fff;
    font-family: 'Epilogue', sans-serif;
  }
  [data-auth-theme='light'] .pw-toggle:hover {
    background: #f8fafc;
  }
  [data-auth-theme='light'] .auth-btn {
    background: linear-gradient(135deg, #1d4ed8, #3b82f6) !important;
    border-color: #1d4ed8 !important;
    color: #fff !important;
  }
  [data-auth-theme='light'] .auth-divider::before,
  [data-auth-theme='light'] .auth-divider::after {
    background: #d5dcec !important;
  }
  [data-auth-theme='light'] .auth-divider span {
    color: #64748b !important;
  }
  [data-auth-theme='light'] .role-pill {
    border: 1px solid #d5dcec !important;
    background: #fff !important;
  }
  [data-auth-theme='light'] .role-pill:hover {
    border-color: #1d4ed8 !important;
    box-shadow: none;
  }
  [data-auth-theme='light'] .role-pill.selected {
    border-color: #1d4ed8 !important;
    background: #dbeafe !important;
  }
  [data-auth-theme='light'] .role-pill-label {
    color: #334155 !important;
  }
  [data-auth-theme='light'] .role-pill.selected .role-pill-label {
    color: #1e3a8a !important;
  }
  [data-auth-theme='light'] .forgot-link {
    color: #1d4ed8 !important;
  }
  [data-auth-theme='light'] .forgot-link:hover {
    color: #1e40af !important;
    text-shadow: none;
  }
  [data-auth-theme='light'] .theme-toggle {
    background: #fff;
    color: #475569;
    border-color: #d5dcec;
  }
  [data-auth-theme='light'] .theme-toggle:hover {
    color: #1d4ed8;
    border-color: #1d4ed8;
  }

  /* Landing palette override */
  :root {
    --ink: #e8eaed;
    --paper: #0a0e27;
    --accent: #0066ff;
    --mid: #9ca3af;
    --border: rgba(255, 255, 255, 0.14);
    --success: #00d9a3;
  }

  body {
    background:
      radial-gradient(circle at 20% 30%, rgba(0, 102, 255, 0.16), transparent 44%),
      radial-gradient(circle at 80% 70%, rgba(255, 51, 102, 0.14), transparent 40%),
      #0a0e27 !important;
    color: var(--ink);
    font-family: 'Outfit', sans-serif;
  }

  .auth-left {
    background: linear-gradient(160deg, #0a0e27, #141835) !important;
    border-right: 1px solid var(--border);
  }

  .auth-right {
    background: linear-gradient(180deg, #0f1432 0%, #0a0e27 100%) !important;
  }

  .auth-form-wrap {
    border: 1px solid var(--border);
    background: rgba(20, 24, 53, 0.9) !important;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
    border-radius: 16px;
    padding: 28px;
  }

  .auth-brand-text,
  .auth-form-title,
  .auth-left-headline,
  .auth-btn {
    font-family: 'Syne', sans-serif !important;
    text-transform: none;
    letter-spacing: -0.01em;
  }

  .auth-left-headline span {
    color: #ff3366;
  }

  .auth-left-sub,
  .stat-lbl,
  .auth-form-sub,
  .auth-terms,
  .field-label,
  .forgot-link {
    color: var(--mid) !important;
  }

  .field-input,
  .field-select,
  .role-pill,
  .theme-toggle {
    background: rgba(30, 36, 69, 0.8) !important;
    border: 1px solid var(--border) !important;
    color: var(--ink) !important;
    font-family: 'Outfit', sans-serif !important;
  }

  .field-input:focus,
  .field-select:focus,
  .role-pill:hover {
    border-color: #0066ff !important;
    box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
  }

  .auth-btn {
    background: linear-gradient(135deg, #0066ff 0%, #ff3366 100%) !important;
    border: none !important;
    color: #fff !important;
    border-radius: 12px;
  }

  .auth-btn:hover:not(:disabled) {
    box-shadow: 0 10px 24px rgba(0, 102, 255, 0.34);
  }

  .role-pill.selected {
    background: rgba(0, 102, 255, 0.22) !important;
    border-color: #0066ff !important;
  }

  [data-auth-theme='light'] {
    --ink: #0f172a;
    --paper: #eef3ff;
    --accent: #0066ff;
    --mid: #475569;
    --border: rgba(15, 23, 42, 0.12);
    --success: #059669;
  }

  [data-auth-theme='light'] body {
    background: linear-gradient(150deg, #eef3ff 0%, #f8fbff 100%) !important;
    color: var(--ink);
  }

  [data-auth-theme='light'] .auth-left {
    background: linear-gradient(160deg, #1e2445, #141835) !important;
  }

  [data-auth-theme='light'] .auth-right {
    background: linear-gradient(180deg, #eef3ff 0%, #f8fbff 100%) !important;
  }

  [data-auth-theme='light'] .auth-form-wrap {
    background: #ffffff !important;
    border: 1px solid rgba(15, 23, 42, 0.12);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  }

  [data-auth-theme='light'] .auth-form-title,
  [data-auth-theme='light'] .auth-brand-text,
  [data-auth-theme='light'] .field-input,
  [data-auth-theme='light'] .field-select,
  [data-auth-theme='light'] .role-pill,
  [data-auth-theme='light'] .theme-toggle {
    color: #0f172a !important;
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

    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;

      authService.setToken(token);
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

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFE(fe => ({ ...fe, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())         errs.name     = true;
    if (!form.email.includes('@')) errs.email    = true;
    if (form.password.length < 6)  errs.password = true;
    if (form.password !== form.confirmPassword) errs.confirmPassword = true;
    if (!form.department.trim())   errs.department = true;
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
      const payload = { ...form };
      delete payload.confirmPassword;
      const res = await api.post('/auth/register', payload);
      const { token, user } = res.data;

      authService.setToken(token);
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

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
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
                      onChange={(e) => setPassword(e.target.value)}
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





