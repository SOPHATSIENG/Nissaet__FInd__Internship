import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, User, Mail, Lock, Building2, MapPin } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { RoleSelector, Role } from '../../components/RoleSelector';
import { useAuth } from '../../context/AuthContext';
import { registrationStorage } from '../../utils/registrationStorage';

export function Register() {
  const [role, setRole] = useState<Role>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const { loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const inferredName = useMemo(() => {
    const combined = `${firstName} ${lastName}`.trim();
    if (combined) {
      return combined;
    }
    const prefix = email.split('@')[0] || '';
    if (!prefix) return 'Social User';
    return prefix
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [email, firstName, lastName]);

  const validateForm = () => {
    if (!firstName.trim()) {
      return 'First name is required.';
    }
    if (!lastName.trim()) {
      return 'Last name is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (role === 'company' && !companyName.trim()) {
      return 'Company name is required.';
    }
    if (!agreed) {
      return 'Please accept Terms and Privacy Policy.';
    }
    return '';
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const step1Payload = {
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      password,
      role,
      company_name: role === 'company' ? companyName.trim() : undefined,
      location: role === 'company' ? (companyLocation.trim() || 'Unknown') : undefined,
    };

    registrationStorage.setStep1(step1Payload);
    registrationStorage.setRole(role);
    registrationStorage.clearStep2();

    setError('');
    navigate(role === 'company' ? '/register/company/step-2' : '/register/student/step-2');
  };

  const handleGoogleRegister = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter your email first to continue with Google.');
      return;
    }
    if (role === 'company' && !companyName.trim()) {
      setError('Enter company name first for company social registration.');
      return;
    }

    try {
      setError('');
      setIsGoogleLoading(true);
      const session = await loginWithGoogle({
        email: email.trim(),
        fullName: inferredName,
        role,
        companyName: role === 'company' ? companyName.trim() : undefined,
        location: role === 'company' ? (companyLocation.trim() || 'Unknown') : undefined,
      });

      const target = typeof location.state?.from === 'string' ? location.state.from : '';
      const resolvedRole = session?.user?.role;
      if (target.startsWith('/company') && resolvedRole !== 'company') {
        setError('This account is not a company account.');
        navigate('/', { replace: true });
        return;
      }
      if (target) {
        navigate(target);
        return;
      }
      navigate(resolvedRole === 'company' ? '/company' : '/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Google registration failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubRegister = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter your email first to continue with GitHub.');
      return;
    }
    if (role === 'company' && !companyName.trim()) {
      setError('Enter company name first for company social registration.');
      return;
    }

    try {
      setError('');
      setIsGithubLoading(true);
      const session = await loginWithGithub({
        email: email.trim(),
        fullName: inferredName,
        role,
        companyName: role === 'company' ? companyName.trim() : undefined,
        location: role === 'company' ? (companyLocation.trim() || 'Unknown') : undefined,
      });

      const target = typeof location.state?.from === 'string' ? location.state.from : '';
      const resolvedRole = session?.user?.role;
      if (target.startsWith('/company') && resolvedRole !== 'company') {
        setError('This account is not a company account.');
        navigate('/', { replace: true });
        return;
      }
      if (target) {
        navigate(target);
        return;
      }
      navigate(resolvedRole === 'company' ? '/company' : '/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'GitHub registration failed.');
    } finally {
      setIsGithubLoading(false);
    }
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-[#137fec]/90 to-[#137fec]/40"
      title="Join Our Community"
      subtitle="Connect with top companies, discover new opportunities, and manage your career journey all in one place."
    >
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          {role === 'company' ? 'Create company account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#137fec] hover:text-[#137fec]/80 transition-colors">
            Log in
          </Link>
        </p>
      </div>

      <div className="mb-6">
        <RoleSelector selectedRole={role} onChange={setRole} />
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {role === 'company' ? (
          <>
            <Input
              label="Company Name"
              placeholder="Acme Inc."
              required
              icon={Building2}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
            <Input
              label="Company Location"
              placeholder="Phnom Penh"
              icon={MapPin}
              value={companyLocation}
              onChange={(event) => setCompanyLocation(event.target.value)}
            />
          </>
        ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={role === 'company' ? 'Contact Person First Name' : 'First Name'}
              placeholder="John"
              required
              icon={User}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <Input
              label={role === 'company' ? 'Contact Person Last Name' : 'Last Name'}
              placeholder="Doe"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          required
          icon={Mail}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Password"
          type="password"
          placeholder="********"
          required
          icon={Lock}
          helperText="Must be at least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="flex items-start">
          <div className="flex h-6 items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#137fec] focus:ring-[#137fec] bg-slate-50"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label htmlFor="terms" className="font-medium text-slate-700">
              I agree to the <a href="#" className="font-bold text-[#137fec] hover:text-[#137fec]/80">Terms of Service</a> and <a href="#" className="font-bold text-[#137fec] hover:text-[#137fec]/80">Privacy Policy</a>.
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" icon={ArrowRight}>
          Continue to Step 2
        </Button>
      </form>

      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#f6f7f8] px-2 text-xs text-slate-400 uppercase tracking-widest font-medium">
            Or register with
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isGoogleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {isGoogleLoading ? 'Connecting...' : 'Google'}
        </button>
        <button
          type="button"
          onClick={handleGithubRegister}
          disabled={isGithubLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
        >
          <svg className="h-5 w-5 fill-[#24292F]" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          {isGithubLoading ? 'Connecting...' : 'GitHub'}
        </button>
      </div>
    </SplitLayout>
  );
}
