import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface HeaderNotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export default function Layout() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const notificationCardRef = useRef<HTMLDivElement | null>(null);
  const [headerProfileImage, setHeaderProfileImage] = useState('');
  const [headerFullName, setHeaderFullName] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotificationCard, setLoadingNotificationCard] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Internships', path: '/internships' },
    { name: 'Companies', path: '/companies' },
    { name: 'Blog & Events', path: '/blog' },
    { name: 'Career Advice', path: '/career-advice' },
  ];

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
        setHeaderProfileImage(personal?.profile_image || '');
        setHeaderFullName(personal?.full_name || '');
      } catch {
        if (!isCurrent) return;
        setHeaderProfileImage('');
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
    // FIX MARK: refresh top avatar immediately after profile image is updated in settings page.
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ personal?: { profile_image?: string; full_name?: string } }>;
      const personal = customEvent.detail?.personal;
      if (!personal) return;

      if (typeof personal.profile_image === 'string') {
        setHeaderProfileImage(personal.profile_image);
      }
      if (typeof personal.full_name === 'string') {
        setHeaderFullName(personal.full_name);
      }
    };

    window.addEventListener('profile-settings-updated', handleProfileUpdated as EventListener);
    return () => {
      window.removeEventListener('profile-settings-updated', handleProfileUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!notificationOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationCardRef.current && !notificationCardRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  useEffect(() => {
    setNotificationOpen(false);
  }, [location.pathname]);

  const handleNotificationClick = () => {
    setNotificationOpen((previous) => {
      const next = !previous;
      if (next) {
        loadNotificationCard();
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f6f8f7] text-[#111816]">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 text-[#3b82f6]">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">NSI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-slate-50 hover:text-[#3b82f6] relative group ${
                    isActiveLink(link.path) ? 'text-[#3b82f6] bg-blue-50/50' : 'text-slate-600'
                  }`}
                >
                  {link.name}
                  <span className={`absolute bottom-1.5 left-4 right-4 h-0.5 bg-[#3b82f6] rounded-full transition-all duration-300 transform origin-left ${
                    isActiveLink(link.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`} />
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 pl-6 border-l border-slate-200 text-sm text-gray-600 relative">
                    {/* FIX MARK: bell icon now opens notification dropdown card with DB-backed notification list. */}
                    <div className="relative" ref={notificationCardRef}>
                      <button
                        type="button"
                        onClick={handleNotificationClick}
                        className="relative p-2 text-slate-400 hover:text-slate-600"
                        aria-label="Open notifications"
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </button>

                      {notificationOpen && (
                        <div className="absolute right-0 mt-3 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                            <span className="text-xs text-slate-500">{unreadCount} unread</span>
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
                                  className={`px-4 py-3 border-b border-slate-100 last:border-b-0 ${
                                    item.is_read ? 'bg-white' : 'bg-blue-50/40'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                                      <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                                      <p className="text-[11px] text-slate-400 mt-1">
                                        {formatNotificationTime(item.created_at)}
                                      </p>
                                    </div>
                                    {!item.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                                  </div>
                                  {item.action_url && (
                                    <Link
                                      to={item.action_url}
                                      className="inline-block mt-2 text-xs font-semibold text-[#3b82f6] hover:underline"
                                      onClick={() => setNotificationOpen(false)}
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
                    </div>
                    {/* FIX MARK: added profile text link to open student settings page. */}
                    <Link
                      to="/account-settings"
                      className="text-sm font-medium text-slate-600 hover:text-[#3b82f6]"
                    >
                      Profile
                    </Link>
                    {/* FIX MARK: clicking profile avatar now opens account settings page. */}
                    <Link to="/account-settings" aria-label="Open account settings">
                      {/* FIX MARK: top profile avatar now uses uploaded image from database. */}
                      <div className="h-10 w-10 rounded-full border-2 border-white shadow-sm cursor-pointer overflow-hidden bg-slate-200 flex items-center justify-center">
                        {displayProfileImage ? (
                          <img
                            src={displayProfileImage}
                            alt="Profile avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-slate-600">{profileInitials || 'ST'}</span>
                        )}
                      </div>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="bg-gray-100 hover:bg-gray-200 text-[#111816] text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium hover:text-[#3b82f6] transition-colors">
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <button className="md:hidden p-2 text-gray-500">
              <Menu className="w-6 h-6" />
            </button>
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
