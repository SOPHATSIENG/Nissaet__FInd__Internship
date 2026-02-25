import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/Dashboard';
import CompanyDashboard from './pages/company/Dashboard';
import InternshipList from './pages/InternshipList';

import { AuthProvider } from './context/AuthContext';

// Placeholder components if not created yet
const Placeholder = ({ title }) => <div className="text-2xl font-bold">{title}</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="internships" element={<InternshipList />} />

            {/* Protected Routes (Placeholder protection) */}
            <Route path="student/dashboard" element={<StudentDashboard />} />
            <Route path="company/dashboard" element={<CompanyDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
