import { AuthProvider } from './context/AuthContext';
import WebRouter from './router/web';

function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Login successful</h1>
        <p className="mt-2 text-slate-600">
          OAuth callback completed. Replace this page with your real dashboard.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
<<<<<<< HEAD
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/student/step-2" element={<StudentStep2 />} />
        <Route path="/register/student/step-3" element={<StudentStep3 />} />
        <Route path="/register/company/step-2" element={<CompanyStep2 />} />
        <Route path="/register/admin/step-2" element={<AdminStep2 />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
=======
    <AuthProvider>
      <WebRouter />
    </AuthProvider>
>>>>>>> origin/feature/phat
  );
}

