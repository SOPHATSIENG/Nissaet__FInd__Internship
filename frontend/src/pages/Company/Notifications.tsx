import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building2, 
  Lock, 
  Bell, 
  CreditCard,
  Mail,
  Smartphone,
  Globe,
  Check,
  MessageSquare,
  Settings as SettingsIcon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';

export default function Notifications() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'activity' | 'settings'>('activity');

  const navItems = [
    { name: 'Company Profile', icon: Building2, path: '/company/settings' },
    { name: 'Security & Login', icon: Lock, path: '/company/security' },
    { name: 'Notifications', icon: Bell, path: '/company/notifications' },
    { name: 'Billing', icon: CreditCard, path: '/company/billing' },
  ];

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await api.getNotificationCard();
        const items = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data?.items) ? data.items : [];
        if (mounted) {
          setNotifications(items);
        }
      } catch (error: any) {
        if (mounted) {
          setErrorMessage(error?.message || 'Failed to load notifications.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNotifications();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedNotifications = useMemo(() => {
    return notifications.map((notif) => ({
      ...notif,
      timeLabel: notif?.created_at
        ? new Date(notif.created_at).toLocaleString()
        : 'Just now'
    }));
  }, [notifications]);

  const preferences = [
    {
      title: 'Application Alerts',
      desc: 'Get notified when a student applies for your internship.',
      options: [
        { name: 'Email Notifications', enabled: true },
        { name: 'Push Notifications', enabled: true },
        { name: 'In-app Notifications', enabled: true },
      ]
    },
    {
      title: 'Status Updates',
      desc: 'Notifications about your internship post status (active, expired, etc).',
      options: [
        { name: 'Email Notifications', enabled: true },
        { name: 'Push Notifications', enabled: false },
        { name: 'In-app Notifications', enabled: true },
      ]
    },
    {
      title: 'Platform News',
      desc: 'Updates about new features and platform improvements.',
      options: [
        { name: 'Email Notifications', enabled: false },
        { name: 'Push Notifications', enabled: false },
        { name: 'In-app Notifications', enabled: true },
      ]
    }
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with student applications and platform activity.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'activity' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell size={18} />
            Activity
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'settings' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </div>
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

        <div className="flex-1">
          {activeTab === 'activity' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {errorMessage && (
                <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}
              {loading ? (
                <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <Bell size={40} className="opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Loading notifications...</h3>
                  <p className="text-sm mt-1">Fetching the latest updates.</p>
                </div>
              ) : formattedNotifications.length > 0 ? (
                formattedNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
                      notif.is_read ? '' : 'ring-1 ring-primary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{notif.title || 'Notification'}</h3>
                        <p className="text-xs text-slate-500 mt-1">{notif.timeLabel}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                        notif.type === 'system' ? 'border-blue-200 bg-blue-50 text-blue-600' :
                        notif.type === 'message' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' :
                        notif.type === 'reminder' ? 'border-amber-200 bg-amber-50 text-amber-600' :
                        'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        {notif.type || 'system'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">
                      {notif.message || 'No message provided.'}
                    </p>
                    {notif.action_url && (
                      <button
                        onClick={() => window.location.assign(notif.action_url)}
                        className="mt-4 text-sm font-semibold text-primary hover:underline"
                      >
                        Open related item
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <Bell size={40} className="opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                  <p className="text-sm mt-1">No new application messages at the moment.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {preferences.map((group, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{group.desc}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {group.options.map((option, j) => (
                      <div key={j} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            option.name.includes('Email') ? 'bg-blue-50 text-blue-600' :
                            option.name.includes('Push') ? 'bg-purple-50 text-purple-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {option.name.includes('Email') ? <Mail size={20} /> :
                             option.name.includes('Push') ? <Smartphone size={20} /> :
                             <Bell size={20} />}
                          </div>
                          <span className="font-medium text-slate-700">{option.name}</span>
                        </div>
                        <button 
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            option.enabled ? 'bg-primary' : 'bg-slate-200'
                          }`}
                        >
                          <span 
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              option.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex justify-end">
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
