import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = {
  student: '/student',
  teacher: '/teacher',
  hod: '/hod',
  admin: '/admin',
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = roleHome[user.role] || '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;

