import React, { useEffect } from 'react';
import { Lock, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export const Suspended = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const roleLabel = user?.role === 'company' ? 'Company' : 'Student';
  const email = user?.email || '';

  useEffect(() => {
    const status = String(user?.status || '').toLowerCase();
    if (status && status !== 'suspended') {
      if (user?.role === 'company') {
        navigate('/company', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user?.status, user?.role, navigate]);

  const handleRefresh = async () => {
    try {
      const data = await api.getCurrentUser();
      const nextUser = data?.user || data;
      updateUser(nextUser);
    } catch (error) {
      // ignore, still suspended
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto size-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <Lock className="size-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Account Suspended</h1>
        <p className="text-sm text-slate-600 mt-2">
          Your {roleLabel.toLowerCase()} account is currently suspended. Please contact support for more details.
        </p>
        {email && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Mail className="size-3.5" />
            {email}
          </div>
        )}
        <button
          onClick={handleRefresh}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="size-4" />
          Refresh Status
        </button>
      </div>
    </div>
  );
};
