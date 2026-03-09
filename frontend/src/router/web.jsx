import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Register } from '../pages/auth/Register';
import { StudentStep2 } from '../pages/auth/StudentStep2';
import { StudentStep3 } from '../pages/auth/StudentStep3';
import { CompanyStep2 } from '../pages/auth/CompanyStep2';
import { CompanyStep3 } from '../pages/auth/CompanyStep3';
import { AdminStep2 } from '../pages/auth/AdminStep2';
import Layout from '../components/Layout';
import Home from '../pages/student/Home';
import Internships from '../pages/student/Internships';
import InternshipDetails from '../pages/student/InternshipDetails';
import Companies from '../pages/student/Companies';
import CareerAdvice from '../pages/student/CareerAdvice';
import AccountSettings from '../pages/account/AccountSettings';
import { useAuth } from '../context/AuthContext';
// import Applicants from '../pages/student/Applicants';

import CompanyLayout from '../pages/Company/CompanyLayout';
import Dashboard from '../pages/Company/Dashboard';
import PostInternship from '../pages/Company/PostInternship';
import Applicants from '../pages/Company/Applicants';
import MyApplications from '../pages/Company/MyApplications';
import Settings from '../pages/Company/Settings';
import Security from '../pages/Company/Security';
import Notifications from '../pages/Company/Notifications';
import Billing from '../pages/Company/Billing';
import StudentProfile from '../pages/Company/StudentProfile';
import Evaluation from '../pages/Company/Evaluation';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // FIX MARK: block account settings route for logged-out users.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireStudentArea({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return children;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/step-2" replace />;
  }

  if (user?.role === 'company') {
    return <Navigate to="/company" replace />;
  }

  return children;
}

function RequireCompany({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'company') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function WebRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/student/step-2" element={<StudentStep2 />} />
        <Route path="/register/student/step-3" element={<StudentStep3 />} />
        <Route path="/register/company/step-2" element={<CompanyStep2 />} />
        <Route path="/register/company/step-3" element={<CompanyStep3 />} />
        <Route path="/admin/step-2" element={<AdminStep2 />} />
        <Route
          path="/"
          element={(
            <RequireStudentArea>
              <Layout />
            </RequireStudentArea>
          )}
        >
          <Route index element={<Home />} />
          <Route path="internships" element={<Internships />} />
          <Route path="internships/:id" element={<InternshipDetails />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<Companies />} />
          <Route path="career-advice" element={<CareerAdvice />} />
          {/* <Route path="applicants" element={<Applicants />} /> */}
          <Route
            path="account-settings"
            element={(
              <RequireAuth>
                <AccountSettings />
              </RequireAuth>
            )}
          />
        </Route>

        <Route
          path="/company"
          element={(
            <RequireCompany>
              <CompanyLayout />
            </RequireCompany>
          )}
        >
          <Route index element={<Dashboard />} />
          <Route path="post/:id?" element={<PostInternship />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="my-applications" element={<MyApplications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="security" element={<Security />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="billing" element={<Billing />} />
          <Route path="student/:id" element={<StudentProfile />} />
          <Route path="evaluation/:id" element={<Evaluation />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
