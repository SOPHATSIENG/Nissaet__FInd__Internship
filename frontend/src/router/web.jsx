import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Login } from '../pages/auth/Login';
import { AdminLogin } from '../pages/auth/AdminLogin';
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
import api from '../api/axios';

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
import VerificationPending from '../pages/Company/VerificationPending';

import { Sidebar as AdminSidebar } from '../components/Admin_components/Sidebar';
import { Header as AdminHeader } from '../components/Admin_components/Header';
import { Dashboard as AdminDashboard } from '../pages/Admine/Dashboard';
import { UserManagement } from '../pages/Admine/UserManagement';
import { TeamManagement } from '../pages/Admine/TeamManagement';
import { CategoryManagement } from '../pages/Admine/CategoryManagement';
import { CategoryDetailsList } from '../pages/Admine/CategoryDetailsList';
import { Reports } from '../pages/Admine/Reports';
import { Verification } from '../pages/Admine/Verification';
import { SettingsPage } from '../pages/Admine/Settings';
import { ProfileSettings } from '../pages/Admine/ProfileSettings';
import { StudentProfile as AdminStudentProfile } from '../pages/Admine/StudentProfile';
import { motion, AnimatePresence } from 'motion/react';
import { ProfileProvider } from '../context/ProfileContext';
import { Outlet } from 'react-router-dom';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
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
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'company') {
    return <Navigate to="/company" replace />;
  }

  return children;
}

function RequireCompany({ children }) {
  const { isAuthenticated, user, updateUser } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'company') {
    return <Navigate to="/" replace />;
  }

  const isVerified = user?.company_profile?.is_verified === 1 || user?.company_profile?.is_verified === true;

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'company') return;
    if (isVerified || checked) return;

    let isMounted = true;
    const refreshStatus = async () => {
      try {
        setChecking(true);
        const data = await api.getCurrentUser();
        if (!isMounted) return;
        updateUser(data.user || data);
      } catch (error) {
        // leave user as-is, verification page can still show status
      } finally {
        if (isMounted) {
          setChecking(false);
          setChecked(true);
        }
      }
    };

    refreshStatus();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role, isVerified, checked, updateUser]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  if (!isVerified && location.pathname !== '/company/verification') {
    return <Navigate to="/company/verification" replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

const PageWrapper = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const AdminLayout = () => {
  const location = useLocation();

  const getTitle = (path) => {
    if (path.includes('/admin/users')) return 'User Management';
    if (path.includes('/admin/team')) return 'Team Management';
    if (path.includes('/admin/categories/details_list')) return 'Category Details';
    if (path.includes('/admin/categories')) return 'Category Management';
    if (path.includes('/admin/reports')) return 'Platform Reports';
    if (path.includes('/admin/verification')) return 'Verification Center';
    if (path.includes('/admin/settings')) return 'Settings';
    if (path.includes('/admin/profile') && !path.includes('/student')) return 'Admin Profile';
    if (path.includes('/admin/student-profile')) return 'Student Profile';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light">
      <AdminSidebar />
      <main className="flex flex-1 flex-col ml-72 overflow-hidden">
        <AdminHeader title={getTitle(location.pathname)} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <PageWrapper>
            <Outlet />
          </PageWrapper>
        </div>
      </main>
    </div>
  );
};

export default function WebRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        
        {/* Registration Steps */}
        <Route path="/register/student/step-2" element={<StudentStep2 />} />
        <Route path="/register/student/step-3" element={<StudentStep3 />} />
        <Route path="/register/company/step-2" element={<CompanyStep2 />} />
        <Route path="/register/company/step-3" element={<CompanyStep3 />} />
        <Route path="/admin/step-2" element={<AdminStep2 />} />

        {/* Student/Public Area */}
        <Route
          path="/"
          element={
            <RequireStudentArea>
              <Layout />
            </RequireStudentArea>
          }
        >
          <Route index element={<Home />} />
          <Route path="internships" element={<Internships />} />
          <Route path="internships/:id" element={<InternshipDetails />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<Companies />} />
          <Route path="career-advice" element={<CareerAdvice />} />
          <Route
            path="account-settings"
            element={
              <RequireAuth>
                <AccountSettings />
              </RequireAuth>
            }
          />
        </Route>

        {/* Company Area */}
        <Route
          path="/company"
          element={
            <RequireCompany>
              <CompanyLayout />
            </RequireCompany>
          }
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
          <Route path="verification" element={<VerificationPending />} />
        </Route>

        {/* Admin Area */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <ProfileProvider>
                <AdminLayout />
              </ProfileProvider>
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="categories/details_list" element={<CategoryDetailsList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="verification" element={<Verification />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="student-profile" element={<AdminStudentProfile />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
