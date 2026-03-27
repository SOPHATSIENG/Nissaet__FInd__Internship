import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Briefcase, LayoutDashboard, Send, Users, Settings as SettingsIcon, LogOut, User, ChevronDown, Calendar, History, Sparkles } from 'lucide-react';
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

  const getNewCountSinceSuppress = () => {
    if (!notificationCard?.items?.length) return 0;
    if (!suppressUnreadAt) return notificationCard.items.length;
    return notificationCard.items.filter((item: any) => {
      const t = new Date(item.created_at || item.createdAt || item.timestamp || 0).getTime();
      return t > suppressUnreadAt;
    }).length;
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
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.notifications) ? data.notifications : [];
      const rawUnread = Number(data?.unread_count ?? data?.unreadCount ?? 0) || 0;
      const computedUnread = Array.isArray(items)
        ? items.filter((item: any) => !(item?.is_read ?? item?.read)).length
        : 0;
      const unreadCount = rawUnread || computedUnread;
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

  const activeLink = navLinks.find((link) => link.path === location.pathname) || navLinks[0];

  return (
    <header className="sticky top-0 z-50 w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.94))] px-4 py-4 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-4">
        <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_34%)]" />

        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Link
              to="/company"
              className="group flex min-w-0 items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white/80 px-3 py-2 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.55)] ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)] md:px-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f3b68,#0b6fa4_55%,#69b6dc)] text-sm font-bold text-white shadow-inner shadow-slate-900/10">
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

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-lg font-extrabold tracking-tight text-slate-900 md:text-[1.35rem]">
                    {companyName}
                  </p>
                  <span className="hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:inline-flex">
                    Hiring Hub
                  </span>
                </div>
                <p className="hidden text-xs font-medium text-slate-500 sm:block">
                  Manage internships, events, and talent flow in one place
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/85 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm lg:flex">
              <Sparkles size={14} />
              <span>Workspace online</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden rounded-[20px] border border-slate-200/70 bg-white/75 px-3 py-2 shadow-sm lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Current View
              </p>
              <p className="font-display text-sm font-bold text-slate-900">{activeLink.name}</p>
            </div>

            <div className="relative flex items-center gap-2 border-l border-slate-200/80 pl-3 md:pl-4" ref={dropdownRef}>
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
                className="relative rounded-2xl border border-slate-200/70 bg-white/85 p-2.5 text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
              >
                <Bell size={20} />
                {getNewCountSinceSuppress() > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-1 text-[10px] font-bold text-white shadow-sm">
                    {getNewCountSinceSuppress() > 99 ? '99+' : getNewCountSinceSuppress()}
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
                    className="absolute right-0 top-full z-[60] mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(240,253,250,0.8))] p-4">
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
                            className="border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50"
                          >
                            <p className="text-sm font-medium text-slate-900">
                              {item?.title || 'Notification'}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                              {item?.message || ''}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-medium text-slate-700">All caught up</p>
                          <p className="mt-1 text-xs text-slate-500">No new notifications.</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-3">
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
                className="flex items-center gap-2 rounded-[22px] border border-slate-200/70 bg-white/85 p-1.5 pr-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className="h-10 w-10 rounded-2xl border border-white bg-slate-200 bg-cover bg-center shadow-sm"
                  style={{ backgroundImage: avatarUrl ? `url('${avatarUrl}')` : undefined }}
                ></div>
                <div className="hidden text-left md:block">
                  <p className="max-w-32 truncate text-sm font-semibold text-slate-900">{companyName}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Company</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full z-[60] mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(239,246,255,0.92))] p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{companyName}</p>
                        {accountStatus === 'suspended' && (
                          <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">{companyEmail}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/company/settings"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-primary/5 hover:text-primary"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User size={18} />
                        Company Profile
                      </Link>
                      <Link
                        to="/company/settings"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-primary/5 hover:text-primary"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <SettingsIcon size={18} />
                        Account Settings
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group relative flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  location.pathname === link.path
                    ? 'border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(236,254,255,0.95))] text-blue-700 shadow-[0_12px_30px_-22px_rgba(37,99,235,0.65)]'
                    : 'border-slate-200/80 bg-white/78 text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                }`}
              >
                <link.icon size={16} className={location.pathname === link.path ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
