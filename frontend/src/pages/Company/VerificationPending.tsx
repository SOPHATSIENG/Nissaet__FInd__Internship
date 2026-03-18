import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function VerificationPending() {
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [submittedAt, setSubmittedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.companyGetVerificationRequests();
      const latest = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (latest?.status) {
        setStatus(latest.status);
      }
      if (latest?.submitted_at) {
        setSubmittedAt(new Date(latest.submitted_at).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }));
      }
    } catch (err) {
      setError('Unable to load verification status.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.getCurrentUser();
      updateUser(data.user || data);
    } catch (err) {
      setError('Unable to refresh account status.');
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => {
      loadStatus();
      refreshUser();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">
            <ShieldCheck className="size-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Company Verification</h1>
            <p className="text-sm text-slate-500">
              Your company dashboard will unlock after admin approval.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-5 bg-slate-50">
          {isLoading ? (
            <p className="text-sm text-slate-500 font-semibold">Loading status...</p>
          ) : error ? (
            <p className="text-sm text-rose-600 font-semibold">{error}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock className="size-4 text-blue-600" />
                Status: <span className="capitalize">{status}</span>
              </div>
              {submittedAt && (
                <p className="text-xs text-slate-500">Submitted on {submittedAt}</p>
              )}
              {status === 'approved' && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                  <CheckCircle2 className="size-4" />
                  Approved. You can now access the dashboard.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={async () => {
              await loadStatus();
              await refreshUser();
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
          {status === 'approved' && (
            <button
              onClick={() => {
                window.location.href = '/company';
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
