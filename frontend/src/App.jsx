import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Hod from './pages/HOD/Hod';
import Teacher from './pages/Teacher/Teacher';
import Student from './pages/Student/Student';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/hod"
        element={(
          <ProtectedRoute allowedRoles={['hod']}>
            <Hod />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/teacher"
        element={(
          <ProtectedRoute allowedRoles={['teacher']}>
            <Teacher />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/student"
        element={(
          <ProtectedRoute allowedRoles={['student']}>
            <Student />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
};

export default App;
