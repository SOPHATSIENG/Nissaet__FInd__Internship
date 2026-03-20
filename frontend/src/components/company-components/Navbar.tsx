import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Briefcase, LayoutDashboard, Send, Users, Settings as SettingsIcon, LogOut, User, ChevronDown, Calendar, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCard, setNotificationCard] = useState<{ unreadCount: number; items: any[] } | null>(null);
  const [suppressUnreadAt, setSuppressUnreadAt] = useState<number | null>(null);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const companyName =
    user?.company_profile?.company_name ||
    user?.company_profile?.name ||
    user?.company_name ||
    'Company';

  const companyEmail = user?.email || '';

  const companyLogo =
    user?.company_profile?.logo ||
    user?.company_profile?.company_logo ||
    user?.company_logo ||
    '';

  const toAbsoluteUrl = (value: string) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const base = apiBase.replace(/\/api\/?$/, '');
    if (raw.startsWith('/')) return `${base}${raw}`;
    return `${base}/${raw}`;
  };

  const resolvedLogo = toAbsoluteUrl(companyLogo);

  const avatarUrl = user?.profile_image || resolvedLogo || companyLogo || '';
  const accountStatus = String(user?.status || 'active').toLowerCase();

  const hasNewSinceSuppress = () => {
    if (!notificationCard?.items?.length) return false;
    if (!suppressUnreadAt) return true;
    return notificationCard.items.some((item: any) => {
      const t = new Date(item.created_at || item.createdAt || item.timestamp || 0).getTime();
      return t > suppressUnreadAt;
    });
  };

  const companyInitials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotificationCard = useCallback(async () => {
    try {
      if (!user) {
        setNotificationCard(null);
        return;
      }
      const data = await api.getNotificationCard();
      const unreadCount = Number(data?.unread_count ?? data?.unreadCount ?? 0) || 0;
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.notifications) ? data.notifications : [];
      setNotificationCard({ unreadCount, items });
    } catch (error) {
      setNotificationCard(null);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const guardedLoad = async () => {
      if (!mounted) return;
      await loadNotificationCard();
    };
    guardedLoad();
    const id = window.setInterval(guardedLoad, 30000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [loadNotificationCard]);

  const navLinks = [
    { name: 'Dashboard', path: '/company', icon: LayoutDashboard },
    { name: 'Post Internship', path: '/company/post', icon: Send },
    { name: 'Events', path: '/company/events', icon: Calendar },
    { name: 'Applicants', path: '/company/applicants', icon: Users },
    { name: 'Employment', path: '/company/my-applications', icon: Briefcase },
    { name: 'Archived', path: '/company/archived', icon: History },
    { name: 'Settings', path: '/company/settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-4 md:px-6 py-4">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/company" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white overflow-hidden font-bold text-sm">
              {resolvedLogo && !logoError ? (
                <img
                  src={resolvedLogo}
                  alt={companyName}
                  className="h-full w-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : companyInitials ? (
                <span>{companyInitials}</span>
              ) : (
                <Briefcase size={24} />
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{companyName}</h2>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-slate-50 relative group ${
                  location.pathname === link.path
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
                <span className={`absolute bottom-1.5 left-4 right-4 h-0.5 bg-blue-600 rounded-full transition-all duration-300 transform origin-left ${
                  location.pathname === link.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen((current) => !current);
                setIsProfileOpen(false);
                setNotificationCard((prev) =>
                  prev
                    ? {
                        unreadCount: 0,
                        items: Array.isArray(prev.items)
                          ? prev.items.map((item) => ({ ...item, is_read: true }))
                          : prev.items
                      }
                    : prev
                );
                setSuppressUnreadAt(Date.now());
                loadNotificationCard();
              }}
              className="relative p-2 text-slate-400 hover:text-slate-600"
            >
              <Bell size={24} />
              {(notificationCard?.unreadCount || 0) > 0 && hasNewSinceSuppress() ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCard.unreadCount > 99 ? '99+' : notificationCard.unreadCount}
                </span>
              ) : null}
            </button>

            <AnimatePresence>
              {isNotificationsOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[60]"
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">
                      {(notificationCard?.unreadCount || 0) > 0
                        ? `${notificationCard?.unreadCount || 0} unread`
                        : 'No unread notifications'}
                    </p>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {(notificationCard?.items || []).length > 0 ? (
                      (notificationCard?.items || []).slice(0, 8).map((item: any, index: number) => (
                        <div
                          key={item?.id || index}
                          className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {item?.title || 'Notification'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {item?.message || ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm font-medium text-slate-700">All caught up</p>
                        <p className="text-xs text-slate-500 mt-1">No new notifications.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <Link
                      to="/company/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="block w-full text-center text-sm font-semibold text-primary hover:underline"
                    >
                      View all notifications
                    </Link>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors"
            >
              <div
                className="h-10 w-10 rounded-full bg-slate-200 bg-cover bg-center border-2 border-white shadow-sm"
                style={{ backgroundImage: avatarUrl ? `url('${avatarUrl}')` : undefined }}
              ></div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[60]"
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{companyName}</p>
                      {accountStatus === 'suspended' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase border border-rose-200">
                          Suspended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{companyEmail}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/company/settings"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={18} />
                      Company Profile
                    </Link>
                    <Link
                      to="/company/settings"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <SettingsIcon size={18} />
                      Account Settings
                    </Link>
                  </div>
                  <div className="p-2 border-t border-slate-100">
                    <button
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout(navigate);
                      }}
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
