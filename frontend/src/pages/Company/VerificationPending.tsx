import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, FileText, Plus, X, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getFileLabel } from '../../utils/upload';

const normalizeDocuments = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export default function VerificationPending() {
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [submittedAt, setSubmittedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState('');
  const [docError, setDocError] = useState('');
  const [isSavingDocs, setIsSavingDocs] = useState(false);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.companyGetVerificationRequests();
      const latest = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (latest?.status) {
        setStatus(latest.status);
      }
      setVerificationId(latest?.id ?? null);
      setDocuments(normalizeDocuments(latest?.documents));
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

  const handleAddDocument = async () => {
    const trimmed = newDocument.trim();
    if (!trimmed) return;
    if (!verificationId) {
      setDocError('No verification request found.');
      return;
    }
    const nextDocs = [...documents, trimmed];
    try {
      setIsSavingDocs(true);
      setDocError('');
      await api.companyUpdateVerificationDocuments(verificationId, { documents: nextDocs });
      setDocuments(nextDocs);
      setNewDocument('');
    } catch (err) {
      setDocError('Failed to save document.');
    } finally {
      setIsSavingDocs(false);
    }
  };

  const handleRemoveDocument = async (doc: string) => {
    if (!verificationId) {
      setDocError('No verification request found.');
      return;
    }
    const nextDocs = documents.filter((item) => item !== doc);
    try {
      setIsSavingDocs(true);
      setDocError('');
      await api.companyUpdateVerificationDocuments(verificationId, { documents: nextDocs });
      setDocuments(nextDocs);
    } catch (err) {
      setDocError('Failed to update documents.');
    } finally {
      setIsSavingDocs(false);
    }
  };

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

        <div className="mt-6 rounded-2xl border border-slate-200 p-5 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Verification Documents</h2>
            </div>
            <span className="text-xs text-slate-500">{documents.length} files</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 truncate">{getFileLabel(doc)}</span>
                  </div>
                  {status !== 'approved' && (
                    <button
                      onClick={() => handleRemoveDocument(doc)}
                      disabled={isSavingDocs}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-slate-500 text-sm">
                <AlertCircle className="size-4 text-slate-400" />
                No documents uploaded yet.
              </div>
            )}
          </div>

          {status !== 'approved' && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="Add document link or name"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
                />
                <button
                  onClick={handleAddDocument}
                  disabled={isSavingDocs || !newDocument.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  {isSavingDocs ? 'Saving...' : 'Add Document'}
                </button>
              </div>
              {docError && (
                <p className="text-xs text-rose-600 font-semibold">{docError}</p>
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
