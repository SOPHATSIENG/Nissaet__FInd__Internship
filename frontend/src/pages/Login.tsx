import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, EyeOff, Award, Grid } from 'lucide-react';
import { SplitLayout } from '../components/SplitLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export function Login() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  return (
    <SplitLayout
      layoutType="login"
      imageSrc="../image/3.png"
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
        <span className="text-xl font-bold tracking-tight text-slate-900">Nissaet Find Intership</span>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
        <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
      </div>

      <form className="flex flex-col gap-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          icon={Mail}
        />
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              id="password"
              type="password"
              className="block w-full rounded-lg border-0 bg-white py-3 pl-4 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all"
              placeholder="Enter your password"
            />
            <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-slate-600">
              <EyeOff className="h-5 w-5" />
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
          <Link to="/forgot-password" className="text-sm font-medium text-[#137fec] hover:text-[#137fec]/80 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button type="button" className="mt-2 w-full">
          Sign In
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
        onClick={() => {
          window.location.href = `${backendUrl}/api/auth/google`;
        }}
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

      <button
        type="button"
        onClick={() => {
          window.location.href = `${backendUrl}/api/auth/github`;
        }}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.85 10.91.57.11.78-.25.78-.55 0-.27-.01-.99-.02-1.94-3.19.69-3.86-1.54-3.86-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.52-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11.03 11.03 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.23 0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
        <span className="truncate">Continue with GitHub</span>
      </button>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-[#137fec] transition-colors hover:text-[#137fec]/80 hover:underline">
          Register now
        </Link>
      </p>

      <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400">
        <Link to="/privacy-policy" className="hover:text-slate-600">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-slate-600">Terms of Service</Link>
        <Link to="/help-center" className="hover:text-slate-600">Help Center</Link>
      </div>
    </SplitLayout>
  );
}
