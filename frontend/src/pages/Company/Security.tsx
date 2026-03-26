import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building2, 
  Lock, 
  Bell, 
  CreditCard,
  ShieldCheck,
  Smartphone,
  History,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';

export default function Security() {
  const location = useLocation();
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorStatus, setTwoFactorStatus] = useState('');
  
  const navItems = [
    { name: 'Company Profile', icon: Building2, path: '/company/settings' },
    { name: 'Security & Login', icon: Lock, path: '/company/security' },
    { name: 'Notifications', icon: Bell, path: '/company/notifications' },
    { name: 'Billing', icon: CreditCard, path: '/company/billing' },
  ];

  useEffect(() => {
    const loadSecuritySettings = async () => {
      setTwoFactorError('');
      try {
        const response = await api.getProfileSettings();
        if (response?.settings?.security) {
          setTwoFactorEnabled(!!response.settings.security.two_factor_enabled);
        }
      } catch (error) {
        setTwoFactorError(error instanceof Error ? error.message : 'Unable to load security settings.');
      }
    };

    loadSecuritySettings();
  }, []);

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.updatePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setTwoFactorError('');
    setTwoFactorStatus('');
    const nextValue = !twoFactorEnabled;
    setTwoFactorLoading(true);
    try {
      const response = await api.updateTwoFactorSettings({ enabled: nextValue });
      if (response?.settings?.security) {
        setTwoFactorEnabled(!!response.settings.security.two_factor_enabled);
      } else {
        setTwoFactorEnabled(nextValue);
      }
      setTwoFactorStatus(`Two-factor authentication ${nextValue ? 'enabled' : 'disabled'}.`);
      setTimeout(() => setTwoFactorStatus(''), 3000);
    } catch (error) {
      setTwoFactorError(error instanceof Error ? error.message : 'Failed to update two-factor authentication.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const currentSession = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const ua = window.navigator.userAgent.toLowerCase();
    let deviceLabel = 'Current Device';
    let iconType: 'desktop' | 'mobile' = 'desktop';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('android')) {
      deviceLabel = 'Mobile Device';
      iconType = 'mobile';
    } else if (ua.includes('mac')) {
      deviceLabel = 'Mac';
    } else if (ua.includes('win')) {
      deviceLabel = 'Windows PC';
    } else if (ua.includes('linux')) {
      deviceLabel = 'Linux PC';
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local timezone';
    return {
      device: deviceLabel,
      location: timeZone.replace(/_/g, ' '),
      time: 'Active now',
      iconType,
      current: true,
    };
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security & Login</h1>
        <p className="text-slate-500 mt-1">Manage your password, two-factor authentication, and active sessions.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)]">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative p-6 sm:p-8 border-b border-slate-100">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                    Security
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-3">Change Password</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-xl">
                    Keep your company account secure with a strong password that you do not reuse elsewhere.
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                  <Lock size={20} />
                </div>
              </div>
            </div>
            <div className="relative p-6 sm:p-8 space-y-6">
              {passwordError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  {passwordError}
                </p>
              ) : null}
              {passwordSuccess ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {passwordSuccess}
                </p>
              ) : null}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Current Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-slate-200 bg-white/80 focus:ring-slate-900 focus:border-slate-900 py-3 px-4 pr-12 shadow-sm"
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                      autoComplete="current-password"
                      placeholder="Enter current password"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={16} />
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">New Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-slate-200 bg-white/80 focus:ring-slate-900 focus:border-slate-900 py-3 px-4 pr-12 shadow-sm"
                      type="password"
                      value={passwordForm.next}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, next: e.target.value }))}
                      autoComplete="new-password"
                      placeholder="Create a new password"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <ShieldCheck size={16} />
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Confirm New Password</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-slate-200 bg-white/80 focus:ring-slate-900 focus:border-slate-900 py-3 px-4 pr-12 shadow-sm"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Password tips</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                    8+ characters for better strength
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                    Mix letters, numbers, and symbols
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                    Avoid reused passwords
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.6)] hover:bg-slate-800 transition-all disabled:opacity-60"
                >
                  {savingPassword ? <Loader2 className="animate-spin" size={16} /> : null}
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-500 mt-1">Add an extra layer of security to your account.</p>
            </div>
            <div className="p-6">
              {twoFactorError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-4">
                  {twoFactorError}
                </p>
              ) : null}
              {twoFactorStatus ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {twoFactorStatus}
                </p>
              ) : null}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${twoFactorEnabled ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  <ShieldCheck size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">
                    Two-factor authentication is {twoFactorEnabled ? 'enabled' : 'disabled'}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {twoFactorEnabled
                      ? 'Your account is protected with an extra layer of security.'
                      : 'Enable 2FA for stronger protection on this account.'}
                  </p>
                  <button
                    onClick={handleToggleTwoFactor}
                    disabled={twoFactorLoading}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline disabled:opacity-60"
                  >
                    {twoFactorLoading ? <Loader2 className="animate-spin" size={14} /> : null}
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Active Sessions</h2>
              <p className="text-sm text-slate-500 mt-1">Devices currently logged into your account.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {currentSession ? (
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      {currentSession.iconType === 'mobile' ? <Smartphone size={24} /> : <History size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        {currentSession.device}
                        {currentSession.current && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            Current
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-slate-500">{currentSession.location} | {currentSession.time}</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-red-500 hover:text-red-600">Log out</button>
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">No active sessions available.</div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900">Log out of all other sessions</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

