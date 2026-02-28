import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, EyeOff, Eye, Award, Grid, AlertCircle } from 'lucide-react';
import { SplitLayout } from '../components/SplitLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password, navigate);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  return (
    <SplitLayout
      layoutType="login"
      imageSrc="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
      title="Unlock Your Potential"
      subtitle="Join a global network of professionals, students, and forward-thinking companies driving the future of work together."
      badge={
        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Award className="mr-2 h-5 w-5" />
          <span className="text-sm font-medium">Top Rated Platform</span>
        </div>
      }
    >
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#137fec] text-white">
          <Grid className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">UnifiedPortal</span>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
        <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        
        <div>
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="name@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="block w-full rounded-lg border-0 bg-white py-3 pl-4 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div 
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]"
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <a href="#" className="text-sm font-medium text-[#137fec] hover:text-[#137fec]/80 hover:underline">
            Forgot Password?
          </a>
        </div>

        <Button 
          type="submit" 
          className="mt-2 w-full"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
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

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
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
        <span className="truncate">Continue with Google</span>
      </button>

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
