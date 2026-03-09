import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login, ForgotPassword, ResetPassword } from './components/auth/AuthPages';
import DirectorSignup from './components/auth/DirectorSignup';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import DirectorDashboard from './components/DirectorDashboard';
import LogoLoader from './components/shared/LogoLoader';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (booting) {
    return <LogoLoader fullscreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/director-signup" element={<DirectorSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/director/*"
          element={
            <ProtectedRoute allowedRoles={['director']}>
              <DirectorDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ SECURITY FIX: Avoid exposing any default public entry into protected app routes. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
