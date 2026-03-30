import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Eye, EyeOff, Key } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      // Backend only needs email/password for login
      const session = await login(email.trim(), password);
      
      const role = session?.user?.role;

      if (role === 'admin') {
        navigate('/admin');
      } else {
        setError('Access denied. This account does not have administrator privileges.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccess = async () => {
    const demoEmail = 'admin@nissaet.com';
    const demoPassword = 'admin123'; // Standard demo password
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFullName('Admin User');
    
    try {
      setError('');
      setIsLoading(true);
      const session = await login(demoEmail, demoPassword);
      if (session?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Quick access failed. Please use your official credentials.');
      }
    } catch (err) {
      setError('Quick access failed. The demo account may not be configured with "admin123".');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-slate-900/95 to-slate-900/50"
      title="Admin Portal Access"
      subtitle="Monitor platform performance, manage user roles, and oversee internship placements with advanced analytics tools."
      badge={
        <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-400 border border-emerald-500/30">
          <div className="mr-2 h-2 w-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs font-bold tracking-wider uppercase">System Oversight</span>
        </div>
      }
    >
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm">
          NI
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">Nissaet Admin</span>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Administrator Sign In</h2>
        <p className="mt-2 text-slate-500">Please enter your administrative credentials.</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          name="full_name"
          placeholder="Name Administrator"
          icon={User}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />

        <Input
          label="Official Admin Email"
          name="email"
          type="email"
          placeholder="admin@organization.com"
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
              name="password"
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

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">Or quick access</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickAccess}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#137fec] bg-blue-50 py-3 text-sm font-bold text-[#137fec] shadow-sm hover:bg-blue-100 transition-all disabled:opacity-50"
        >
          <Shield className="h-4 w-4" />
          Click to Join as Admin
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-8">
        <p className="text-center text-sm text-slate-500">
          Not an admin?{' '}
          <Link to="/login" className="font-semibold text-[#137fec] transition-colors hover:text-[#137fec]/80 hover:underline">
            Go to User Login
          </Link>
        </p>
      </div>

      <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Key className="h-3 w-3" /> Encrypted Session
        </span>
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" /> Protected IP
        </span>
      </div>
    </SplitLayout>
  );
}
