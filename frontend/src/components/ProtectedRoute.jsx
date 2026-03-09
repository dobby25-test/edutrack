import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

export default function ProtectedRoute({ children, allowedRoles }) {
  // ✅ SECURITY FIX: Prevent unauthenticated users from reaching protected views.
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ SECURITY FIX: Enforce role-based authorization for route access.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'director') return <Navigate to="/director/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
