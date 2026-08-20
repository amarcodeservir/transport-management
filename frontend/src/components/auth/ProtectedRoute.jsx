import { Navigate } from 'react-router-dom';
const normalizeRole = (role = "") => String(role).trim().toLowerCase().replace(/[-\s]+/g, "_");

/* eslint-disable react/prop-types */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user');
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    const fallback = userRole === 'customer' ? '/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
