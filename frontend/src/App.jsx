/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentStep2 } from './pages/StudentStep2';
import { StudentStep3 } from './pages/StudentStep3';
import { CompanyStep2 } from './pages/CompanyStep2';
import { AdminStep2 } from './pages/AdminStep2';
import { AdminDashboard } from './pages/AdminDashboard';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { Unauthorized } from './pages/Unauthorized';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/student/step-2" element={<StudentStep2 />} />
      <Route path="/register/student/step-3" element={<StudentStep3 />} />
      <Route path="/register/company/step-2" element={<CompanyStep2 />} />
      <Route path="/register/admin/step-2" element={<AdminStep2 />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/company/dashboard" element={<CompanyDashboard />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

