import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building2, 
  Lock, 
  Bell, 
  CreditCard,
  Mail,
  Check,
  Settings as SettingsIcon,
  Trash2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useNotifications } from '../../context/NotificationContext';
import { type ProfileNotificationSettings } from '../../components/settings/types';

type NotificationToggleKey = Exclude<keyof ProfileNotificationSettings, 'frequency'>;

const DEFAULT_NOTIFICATION_SETTINGS: ProfileNotificationSettings = {
  internship_matches_email: true,
  internship_matches_in_app: true,
  application_status_email: true,
  application_status_in_app: true,
  career_tips_email: false,
  career_tips_in_app: false,
  frequency: 'Daily',
};

const PREFERENCES = [
  {
    title: 'Application Alerts',
    desc: 'Get notified when a student applies for your internship.',
    emailKey: 'application_status_email',
    inAppKey: 'application_status_in_app',
  },
  {
    title: 'Status Updates',
    desc: 'Notifications about your internship post status (active, expired, etc).',
    emailKey: 'internship_matches_email',
    inAppKey: 'internship_matches_in_app',
  },
  {
    title: 'Platform News',
    desc: 'Updates about new features and platform improvements.',
    emailKey: 'career_tips_email',
    inAppKey: 'career_tips_in_app',
  }
] as const;

export default function Notifications() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'activity' | 'settings'>('activity');
  const { notifications, loading, markAsRead, deleteNotification, markAllAsRead } = useNotifications();

  const [notificationSettings, setNotificationSettings] = useState<ProfileNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');

  const navItems = [
    { name: 'Company Profile', icon: Building2, path: '/company/settings' },
    { name: 'Security & Login', icon: Lock, path: '/company/security' },
    { name: 'Notifications', icon: Bell, path: '/company/notifications' },
    { name: 'Billing', icon: CreditCard, path: '/company/billing' },
  ];

  const formattedNotifications = useMemo(() => {
    return notifications.map((notif) => ({
      ...notif,
      timeLabel: notif?.created_at
        ? new Date(notif.created_at).toLocaleString()
        : 'Just now'
    }));
  }, [notifications]);

  useEffect(() => {
    if (activeTab !== 'settings') return undefined;
    let isCurrent = true;

    const loadSettings = async () => {
      setSettingsLoading(true);
      setSettingsError('');
      setSettingsStatus('');
      try {
        const response = await api.getProfileSettings();
        if (!isCurrent) return;
        const incoming = response?.settings?.notifications;
        setNotificationSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...(incoming || {}),
        });
      } catch (error) {
        if (!isCurrent) return;
        setSettingsError(error instanceof Error ? error.message : 'Failed to load notification settings.');
        setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      } finally {
        if (!isCurrent) return;
        setSettingsLoading(false);
      }
    };

    loadSettings();

    return () => {
      isCurrent = false;
    };
  }, [activeTab]);

  const handleToggle = (key: NotificationToggleKey) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsStatus('');
    try {
      const response = await api.updateNotificationSettings(notificationSettings);
      const nextSettings = response?.settings?.notifications;
      if (nextSettings) {
        setNotificationSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...nextSettings,
        });
      }
      setSettingsStatus('Notification preferences saved.');
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Failed to save notification preferences.');
    } finally {
      setSettingsSaving(false);
    }
  };

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
            <div className="space-y-6">
              {notifications.length > 0 && (
                <div className="flex justify-end">
                  <button 
                    onClick={markAllAsRead}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                  >
                    <Check size={16} />
                    Mark all as read
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all ${
                        notif.is_read ? 'opacity-75' : 'ring-2 ring-blue-500/10 border-blue-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                            <h3 className="text-base font-bold text-slate-900">{notif.title || 'Notification'}</h3>
                          </div>
                          <p className="text-xs text-slate-500">{notif.timeLabel}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notif.is_read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-3 whitespace-pre-line">
                        {notif.message || 'No message provided.'}
                      </p>
                      {notif.action_url && (
                        <Link
                          to={notif.action_url}
                          className="inline-block mt-4 text-sm font-bold text-blue-600 hover:text-blue-700"
                        >
                          View Details &rarr;
                        </Link>
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
            </div>
          ) : (
            <div className="space-y-6">
              {settingsLoading ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-slate-500">
                  Loading notification preferences...
                </div>
              ) : (
                <>
                  {PREFERENCES.map((group, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
                        <p className="text-sm text-slate-500 mt-1">{group.desc}</p>
                      </div>
                      <div className="p-6 space-y-4">
                        {[
                          {
                            key: group.emailKey,
                            label: 'Email Notifications',
                            icon: Mail,
                            color: 'bg-blue-50 text-blue-600',
                          },
                          {
                            key: group.inAppKey,
                            label: 'In-app Notifications',
                            icon: Bell,
                            color: 'bg-emerald-50 text-emerald-600',
                          },
                        ].map((option) => (
                          <div key={option.key} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${option.color}`}>
                                <option.icon size={20} />
                              </div>
                              <span className="font-medium text-slate-700">{option.label}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggle(option.key as NotificationToggleKey)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                notificationSettings[option.key as NotificationToggleKey] ? 'bg-primary' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  notificationSettings[option.key as NotificationToggleKey] ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {(settingsStatus || settingsError) && (
                <p className={`text-sm ${settingsError ? 'text-red-600' : 'text-emerald-600'}`}>
                  {settingsError || settingsStatus}
                </p>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={settingsLoading || settingsSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-all disabled:opacity-60"
                >
                  {settingsSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
