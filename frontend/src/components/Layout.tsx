import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import api from '..https://3.236.242.186.nip.io/api/axios';
import { useAuth } from '../context/AuthContext';
import logoAsset from '../../image/1.png';

interface HeaderNotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

const replaceFlaggedText = (value?: string | null) => {
  if (!value) return '';
  return value.replace(/\bflagged\b/gi, 'Banned');
};

export default function Layout() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [headerProfileImage, setHeaderProfileImage] = useState('');
  const [headerFullName, setHeaderFullName] = useState('');
  const [headerIsAvailable, setHeaderIsAvailable] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingNotificationCard, setLoadingNotificationCard] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Nissaet');
  const [logoError, setLogoError] = useState(false);
  const derivedUnreadCount = Math.max(
    unreadCount,
    notifications.filter((item) => !item.is_read).length
  );

  const baseLinks = [
    { name: 'Home', path: '/' },
    { name: 'Internships', path: '/internships' },
    { name: 'Companies', path: '/companies' },
    { name: 'Blog & Events', path: '/blog' },
    { name: 'Career Advice', path: '/career-advice' },
  ];

  const navLinks = isAuthenticated
    ? [...baseLinks, { name: 'Dashboard', path: '/dashboard' }]
    : baseLinks;

  const toAbsoluteUrl = (value: string) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://3.236.242.186.nip.io/api';
    const base = apiBase.replace(/\https://3.236.242.186.nip.io/api\/?$/, '');
    if (raw.startsWith('/')) return `${base}${raw}`;
    return `${base}/${raw}`;
  };

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const activeLink = navLinks.find((link) => isActiveLink(link.path)) || navLinks[0];

  const profileName = useMemo(
    () => headerFullName || user?.full_name || user?.name || 'Student',
    [headerFullName, user]
  );

  const profileInitials = useMemo(() => {
    return profileName
      .split(/\s+/)
      .filter(Boolean)
      .map((token: string) => token.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [profileName]);

  const displayProfileImage = headerProfileImage || user?.profile_image || '';

  const resolvedBrandLogo = toAbsoluteUrl(brandLogo);
  const navbarLogo = logoError || !resolvedBrandLogo ? logoAsset : resolvedBrandLogo;

  useEffect(() => {
    let mounted = true;
    const loadBranding = async () => {
      try {
        const response = await api.getBranding();
        const branding = response?.branding || response?.settings || response || {};
        if (!mounted) return;
        setBrandName(String(branding.platformName || 'Nissaet'));
        setBrandLogo(String(branding.brandLogo || ''));
      } catch {
        if (!mounted) return;
        setBrandName('Nissaet');
        setBrandLogo('');
      }
    };

    loadBranding();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setLogoError(false);
  }, [brandLogo]);

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return 'Just now';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const loadNotificationCard = async () => {
    if (!isAuthenticated) return;
    setLoadingNotificationCard(true);
    try {
      const response = await api.getNotificationCard();
      setNotifications(Array.isArray(response?.notifications) ? response.notifications : []);
      setUnreadCount(Number(response?.unread_count || 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotificationCard(false);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!isAuthenticated || unreadCount === 0) return;
    try {
      await api.markNotificationsRead({ all: true });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadHeaderData = async () => {
      if (!isAuthenticated) {
        setHeaderProfileImage('');
        setHeaderFullName('');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const settingsResponse = await api.getProfileSettings();
        if (!isCurrent) return;
        const personal = settingsResponse?.settings?.personal;
        const education = settingsResponse?.settings?.education;
        setHeaderProfileImage(personal?.profile_image || '');
        setHeaderFullName(personal?.full_name || '');
        setHeaderIsAvailable(!!education?.is_available);
      } catch {
        if (!isCurrent) return;
        setHeaderProfileImage('');
        setHeaderIsAvailable(false);
      }

      try {
        const notificationResponse = await api.getNotificationCard();
        if (!isCurrent) return;
        setNotifications(Array.isArray(notificationResponse?.notifications) ? notificationResponse.notifications : []);
        setUnreadCount(Number(notificationResponse?.unread_count || 0));
      } catch {
        if (!isCurrent) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadHeaderData();

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isActive = true;

    const refreshNotifications = async () => {
      try {
        const notificationResponse = await api.getNotificationCard();
        if (!isActive) return;
        setNotifications(Array.isArray(notificationResponse?.notifications) ? notificationResponse.notifications : []);
        setUnreadCount(Number(notificationResponse?.unread_count || 0));
      } catch {
        if (!isActive) return;
      }
    };

    const intervalId = window.setInterval(refreshNotifications, 30000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // FIX MARK: refresh top avatar immediately after profile image is updated in settings page.
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        personal?: { profile_image?: string; full_name?: string };
        education?: { is_available?: boolean };
      }>;
      const personal = customEvent.detail?.personal;
      const education = customEvent.detail?.education;

      if (typeof personal?.profile_image === 'string') {
        setHeaderProfileImage(personal.profile_image);
      }
      if (typeof personal?.full_name === 'string') {
        setHeaderFullName(personal.full_name);
      }
      if (typeof education?.is_available === 'boolean') {
        setHeaderIsAvailable(education.is_available);
      }
    };

    window.addEventListener('profile-settings-updated', handleProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('profile-settings-updated', handleProfileUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleNotificationClick = () => {
    setNotificationOpen((previous) => {
      const next = !previous;
      if (next) {
        setProfileOpen(false);
        loadNotificationCard();
        // Mark as read when the dropdown is opened so unread count updates.
        if (unreadCount > 0) {
          api.markNotificationsRead({ all: true })
            .then(() => {
              setUnreadCount(0);
              setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
            })
            .catch(() => undefined);
        }
      }
      return next;
    });
  };

  const markNotificationRead = async (id: number) => {
    try {
      await api.markNotificationsRead({ ids: [id] });
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };


  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f6f8f7] text-[#111816]">
      <header className="sticky top-0 z-50 w-full bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <Link
                to="/"
                className="group flex min-w-0 items-center gap-4 rounded-2xl border border-transparent px-2 py-1.5 transition-all duration-200 hover:border-slate-200 md:px-3"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl md:h-23 md:w-23">
                  <img
                    src={navbarLogo}
                    alt={brandName}
                    className="h-full w-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-xl font-extrabold tracking-tight text-slate-900 md:text-[1.6rem]">
                      {brandName}
                    </p>
                    <span className="hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:inline-flex">
                      Student Hope
                    </span>
                  </div>
                  <p className="hidden text-xs font-medium text-slate-500 sm:block">
                    Discover internships, events, and career paths in one place
                  </p>
                </div>
              </Link>

              {/*
                "Open to work" status chip removed from header per request.
                We still keep availability in state for other features.
              */}
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden rounded-[20px] border border-slate-200/70 bg-white/75 px-3 py-2 shadow-sm lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Current View
                </p>
                <p className="font-display text-sm font-bold text-slate-900">{activeLink.name}</p>
              </div>

              <div className="relative flex items-center gap-2 border-l border-slate-200/80 pl-3 md:pl-4" ref={dropdownRef}>
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={handleNotificationClick}
                      className="relative rounded-2xl border border-slate-200/70 bg-white/85 p-2.5 text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
                      aria-label="Open notifications"
                    >
                      <Bell size={20} />
                      {derivedUnreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-1 text-[10px] font-bold text-white shadow-sm">
                          {derivedUnreadCount > 99 ? '99+' : derivedUnreadCount}
                        </span>
                      )}
                    </button>

                    {notificationOpen && (
                      <div className="absolute right-0 top-full z-[60] mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(240,253,250,0.8))] px-4 py-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{derivedUnreadCount} unread</span>
                              {derivedUnreadCount > 0 && (
                                <button
                                  type="button"
                                  onClick={markAllNotificationsRead}
                                  className="text-xs font-semibold text-blue-600 hover:underline"
                                >
                                  Mark all read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="max-h-[360px] overflow-y-auto">
                          {loadingNotificationCard ? (
                            <p className="px-4 py-5 text-sm text-slate-500">Loading notifications...</p>
                          ) : notifications.length === 0 ? (
                            <p className="px-4 py-5 text-sm text-slate-500">No notifications yet.</p>
                          ) : (
                            notifications.map((item) => (
                              <div
                                key={item.id}
                                className={`border-b border-slate-100 px-4 py-3 last:border-b-0 ${
                                  item.is_read ? 'bg-white' : 'bg-blue-50/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{replaceFlaggedText(item.title)}</p>
                                    <p className="mt-1 text-xs text-slate-600">{replaceFlaggedText(item.message)}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                      {formatNotificationTime(item.created_at)}
                                    </p>
                                  </div>
                                  {!item.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                                </div>
                                {item.action_url && (
                                  <Link
                                    to={item.action_url}
                                    className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                                    onClick={() => {
                                      markNotificationRead(item.id);
                                      setNotificationOpen(false);
                                    }}
                                  >
                                    Open
                                  </Link>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen((prev) => !prev);
                        setNotificationOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-[22px] border border-slate-200/70 bg-white/85 p-1.5 pr-2 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className={`relative h-10 w-10 rounded-2xl border border-white bg-slate-200 shadow-sm`}>
                        {displayProfileImage ? (
                          <img
                            src={displayProfileImage}
                            alt="Profile avatar"
                            className="h-full w-full rounded-2xl object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                            {profileInitials || 'ST'}
                          </span>
                        )}
                        {/*
                          Availability dot removed from header avatar per request.
                        */}
                      </div>
                      <div className="hidden text-left md:block">
                        <p className="max-w-32 truncate text-sm font-semibold text-slate-900">{profileName}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Student</p>
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 top-full z-[60] mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(239,246,255,0.92))] p-4">
                          <p className="text-sm font-semibold text-slate-900">{profileName}</p>
                          <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/account-settings"
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-primary/5 hover:text-primary"
                            onClick={() => setProfileOpen(false)}
                          >
                            <User size={18} />
                            Account Settings
                          </Link>
                        </div>
                        <div className="border-t border-slate-100 p-2">
                          <button
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                            onClick={() => {
                              setProfileOpen(false);
                              logout();
                            }}
                          >
                            <LogOut size={18} />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600">
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              <button className="md:hidden rounded-2xl border border-slate-200/70 bg-white/80 p-2 text-slate-500 shadow-sm">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <nav className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`group relative flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    isActiveLink(link.path)
                      ? 'border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(236,254,255,0.95))] text-blue-700 shadow-[0_12px_30px_-22px_rgba(37,99,235,0.65)]'
                      : 'border-slate-200/80 bg-white/78 text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 text-[#3b82f6]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="font-bold text-lg">InternKhmer</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">Connecting Cambodian students with their future careers.</p>
          </div>

          <div>
            <h3 className="font-bold mb-4">For Students</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="/internships" className="hover:text-[#3b82f6]">
                  Browse Internships
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Job Alerts
                </Link>
              </li>
              <li>
                <Link to="/career-advice" className="hover:text-[#3b82f6]">
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">For Employers</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#3b82f6]">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
          (c) 2024 InternKhmer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

