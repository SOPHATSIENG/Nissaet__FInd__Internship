import React from 'react';
import { 
  Building2, 
  Lock, 
  Bell, 
  CreditCard,
  ShieldCheck,
  Smartphone,
  History,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Security() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Company Profile', icon: Building2, path: '/company/settings' },
    { name: 'Security & Login', icon: Lock, path: '/company/security' },
    { name: 'Notifications', icon: Bell, path: '/company/notifications' },
    { name: 'Billing', icon: CreditCard, path: '/company/billing' },
  ];

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
                      ? 'bg-white text-primary shadow-sm border border-slate-200' 
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Current Password</label>
                  <input className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-2.5" type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">New Password</label>
                  <input className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-2.5" type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Confirm New Password</label>
                  <input className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-2.5" type="password" />
                </div>
              </div>
              <div className="pt-4">
                <button className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all">
                  Update Password
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
              <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <ShieldCheck size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Two-factor authentication is enabled</h4>
                  <p className="text-sm text-slate-600 mt-1">Your account is protected with an extra layer of security.</p>
                  <button className="mt-3 text-sm font-bold text-primary hover:underline">Disable 2FA</button>
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
              {[
                { device: 'MacBook Pro 16"', location: 'Phnom Penh, Cambodia', time: 'Active now', icon: History, current: true },
                { device: 'iPhone 15 Pro', location: 'Siem Reap, Cambodia', time: '2 hours ago', icon: Smartphone },
              ].map((session, i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <session.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        {session.device}
                        {session.current && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Current</span>}
                      </h4>
                      <p className="text-sm text-slate-500">{session.location} • {session.time}</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-red-500 hover:text-red-600">Log out</button>
                </div>
              ))}
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

