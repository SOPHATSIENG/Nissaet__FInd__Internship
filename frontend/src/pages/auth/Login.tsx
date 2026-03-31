import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, Award, Grid } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import loginImage from '../../../image/3.png';
import brandLogo from '../../../image/1.png';
import { useAuth } from '../../context/AuthContext';
import { registrationStorage } from '../../utils/registrationStorage';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const authError = params.get('error');
    const registerFlow = params.get('register') === '1';
    const roleParam = params.get('role');
    const providerParam = params.get('provider');
    const companyNameParam = params.get('company_name');
    const locationParam = params.get('location');

    if (token) {
      const handleTokenLogin = async () => {
        try {
          setIsLoading(true);
          const session = await loginWithToken(token);
          const role = session?.user?.role;

          const hasValue = (value: unknown) => String(value || '').trim().length > 0;
          const studentProfile = session?.user?.student_profile || {};
          const companyProfile = session?.user?.company_profile || {};

          const isStudentProfileComplete = () => {
            return (
              hasValue(studentProfile.phone || session?.user?.phone) &&
              hasValue(studentProfile.dob || studentProfile.date_of_birth || session?.user?.dob) &&
              hasValue(studentProfile.address || session?.user?.address) &&
              hasValue(studentProfile.education || studentProfile.current_education_level || session?.user?.education) &&
              hasValue(studentProfile.graduation_year || session?.user?.graduation_year) &&
              hasValue(studentProfile.university || session?.user?.university) &&
              hasValue(studentProfile.bio || session?.user?.bio) &&
              hasValue(studentProfile.cv_url || studentProfile.resume_url || session?.user?.cv_url || session?.user?.resume_url)
            );
          };

          const isCompanyProfileComplete = () => {
            return hasValue(companyProfile.company_name || companyProfile.name);
          };

          const normalizedRole = String(roleParam || role || 'student').toLowerCase();
          const shouldCompleteProfile =
            registerFlow ||
            (normalizedRole === 'student' && !isStudentProfileComplete()) ||
            (normalizedRole === 'company' && !isCompanyProfileComplete());

          if (shouldCompleteProfile && normalizedRole !== 'admin') {
            const fullName = session?.user?.full_name || session?.user?.name || 'Social User';
            const email = session?.user?.email || '';

            registrationStorage.setStep1({
              full_name: fullName,
              email,
              role: normalizedRole,
              company_name:
                normalizedRole === 'company'
                  ? (companyNameParam || companyProfile.company_name || companyProfile.name || '')
                  : undefined,
              location:
                normalizedRole === 'company'
                  ? (locationParam || companyProfile.location || '')
                  : undefined,
              is_social: true,
              auth_provider: providerParam || 'social',
            });
            registrationStorage.setRole(normalizedRole);
            registrationStorage.clearStep2();

            navigate(
              normalizedRole === 'company' ? '/register/company/step-2' : '/register/student/step-2',
              { replace: true }
            );
            return;
          }

          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'company') {
            navigate('/company');
          } else {
            navigate('/');
          }
        } catch (err) {
          setError('Social login failed to initialize session.');
        } finally {
          setIsLoading(false);
        }
      };
      handleTokenLogin();
    } else if (authError) {
      setError('Social authentication failed. Please try again.');
    }
  }, [location, navigate, loginWithToken]);

  const inferredGoogleName = useMemo(() => {
    const prefix = email.split('@')[0] || '';
    if (!prefix) return 'Google User';
    return prefix
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [email]);

  const isValidEmail = (value: string) => {
    const normalized = String(value || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  };

  const validateLogin = () => {
    if (!isValidEmail(email)) {
      return 'Enter a valid email address (e.g., name@example.com).';
    }
    if (!password) {
      return 'Please enter your password.';
    }
    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationMessage = validateLogin();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const session = await login(email.trim(), password);
      if (!rememberMe) {
        sessionStorage.setItem('nissaet_session', 'active');
      }

      const target = typeof location.state?.from === 'string' ? location.state.from : '';
      const role = session?.user?.role;

      if (target.startsWith('/company') && role !== 'company') {
        setError('This account is not a company account.');
        navigate('/', { replace: true });
        return;
      }

      if (target) {
        navigate(target);
        return;
      }

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'company') {
        navigate('/company');
      } else {
        navigate('/');
      }
    } catch (submitError) {
      const rawMessage = submitError instanceof Error ? submitError.message : 'Login failed.';
      const lowered = rawMessage.toLowerCase();
      if (lowered.includes("couldn't find an account")) {
        setError("We couldn't find an account with that email.");
      } else if (lowered.includes('incorrect password')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(rawMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://35.172.230.210:5001/api';
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGithubLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://35.172.230.210:5001/api';
    window.location.href = `${backendUrl}/auth/github`;
  };

  const handleDirectAdminLogin = async () => {
    const demoEmail = 'admin@nissaet.com';
    const demoPassword = 'admin123';
    
    try {
      setError('');
      setIsLoading(true);
      const session = await login(demoEmail, demoPassword);
      if (session?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Direct admin login failed. Please use official admin portal.');
        navigate('/admin/login');
      }
    } catch (err) {
      setError('Direct admin login failed. Redirecting to admin portal...');
      navigate('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SplitLayout
      layoutType="login"
      imageSrc={loginImage}
      title="Unlock Your Potential"
      subtitle="Join a global network of professionals, students, and forward-thinking companies driving the future of work together."
      badge={
        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Award className="mr-2 h-5 w-5" />
          <span className="text-sm font-medium">Top Rated Platform</span>
        </div>
      }
    >
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden">
            <img src={brandLogo} alt="Nissaet logo" className="h-full w-full object-contain scale-110" />
          </div>
          {/* <span className="text-xl font-bold tracking-tight text-slate-900">Nissaet</span> */}
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
        <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="block w-full rounded-lg border-0 bg-white py-3 pl-4 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]"
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-[#137fec] hover:text-[#137fec]/80 hover:underline">
            Forgot Password?
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#f6f7f8] px-3 text-xs font-medium uppercase text-slate-500">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="whitespace-nowrap">{isGoogleLoading ? 'Connecting...' : 'Google'}</span>
        </button>

        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={isGithubLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <svg className="h-5 w-5 fill-[#24292F]" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span className="whitespace-nowrap">{isGithubLoading ? 'Connecting...' : 'GitHub'}</span>
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-[#137fec] transition-colors hover:text-[#137fec]/80 hover:underline">
          Register now
        </Link>
      </p>
      <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400">
        <a href="#" className="hover:text-slate-600">Privacy Policy</a>
        <a href="#" className="hover:text-slate-600">Terms of Service</a>
        <a href="#" className="hover:text-slate-600">Help Center</a>
      </div>
    </SplitLayout>
  );
}

