import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Register } from '../pages/auth/Register';
import { StudentStep2 } from '../pages/auth/StudentStep2';
import { StudentStep3 } from '../pages/auth/StudentStep3';
import { CompanyStep2 } from '../pages/auth/CompanyStep2';
import { AdminStep2 } from '../pages/auth/AdminStep2';
import Layout from '../components/Layout';
import Home from '../pages/student/Home';
import Internships from '../pages/student/Internships';
import InternshipDetails from '../pages/student/InternshipDetails';
import Companies from '../pages/student/Companies';
import CareerAdvice from '../pages/student/CareerAdvice';
import AccountSettings from '../pages/account/AccountSettings';
import Applicants from '../pages/student/Applicants';

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
        <Route path="/admin/step-2" element={<AdminStep2 />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="internships" element={<Internships />} />
          <Route path="internships/:id" element={<InternshipDetails />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<Companies />} />
          <Route path="career-advice" element={<CareerAdvice />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="account-settings" element={<AccountSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
