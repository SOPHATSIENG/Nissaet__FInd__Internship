import React, { useState } from 'react';
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
import ApplicationNotificationCard from '@/components/company-components/ApplicationNotificationCard';

export default function Notifications() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'activity' | 'settings'>('activity');

  const navItems = [
    { name: 'Company Profile', icon: Building2, path: '/company/settings' },
    { name: 'Security & Login', icon: Lock, path: '/company/security' },
    { name: 'Notifications', icon: Bell, path: '/company/notifications' },
    { name: 'Billing', icon: CreditCard, path: '/company/billing' },
  ];

  const [notifications, setNotifications] = useState([
    { 
      id: '1', 
      studentName: 'Sophea Chan', 
      studentAvatar: 'https://picsum.photos/seed/sophea/100/100', 
      internshipRole: 'Marketing Intern', 
      message: "I've been following your company's growth for a while and I'm really excited about the Marketing Intern position. I have experience with social media management and would love to contribute to your team!",
      time: '2 HOURS AGO'
    },
    { 
      id: '2', 
      studentName: 'Dara Sok', 
      studentAvatar: 'https://picsum.photos/seed/dara/100/100', 
      internshipRole: 'Web Developer', 
      message: "Hello! I'm a final year CS student with a strong passion for React and Node.js. I've built several personal projects and I'm eager to learn from the experienced developers at your bank.",
      time: '5 HOURS AGO'
    },
    { 
      id: '3', 
      studentName: 'Vanna Ly', 
      studentAvatar: 'https://picsum.photos/seed/vanna/100/100', 
      internshipRole: 'Data Analyst', 
      message: "I am very interested in the Data Analyst internship. I have strong skills in Python and SQL, and I'm looking for an opportunity to apply them in a real-world banking environment.",
      time: '1 DAY AGO'
    }
  ]);

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
              {notifications.map((notif) => (
                <ApplicationNotificationCard 
                  key={notif.id}
                  {...notif}
                  onApprove={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  onReject={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                />
              ))}
              {notifications.length === 0 && (
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
