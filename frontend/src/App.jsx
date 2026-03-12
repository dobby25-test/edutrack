import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LogoLoader from './components/shared/LogoLoader';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/auth/LoginPage'));
const ForgotPassword = lazy(() => import('./components/auth/AuthPages').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./components/auth/AuthPages').then((m) => ({ default: m.ResetPassword })));
const DirectorSignup = lazy(() => import('./components/auth/DirectorSignup'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const DirectorDashboard = lazy(() => import('./components/DirectorDashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LogoLoader fullscreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
