import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Briefcase, LayoutDashboard, Send, Users, Settings as SettingsIcon, LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const companyName =
    user?.company_profile?.company_name ||
    user?.company_profile?.name ||
    user?.company_name ||
    'Company';

  const companyEmail = user?.email || '';

  const avatarUrl = user?.profile_image || '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/company', icon: LayoutDashboard },
    { name: 'Post Internship', path: '/company/post', icon: Send },
    { name: 'Applicants', path: '/company/applicants', icon: Users },
    { name: 'My Applications', path: '/company/my-applications', icon: Briefcase },
    { name: 'Settings', path: '/company/settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-4 md:px-6 py-4">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/company" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-background-dark">
              <Briefcase size={24} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">InternCambodia</h2>
          </Link>
          <div className="hidden lg:flex items-center w-80">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-slate-50"
                placeholder="Search internships, applicants..."
                type="text"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-slate-900 ${
                  location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
                    ? 'text-primary font-semibold'
                    : 'text-slate-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 relative" ref={dropdownRef}>
            <button className="relative p-2 text-slate-400 hover:text-slate-600">
              <Bell size={24} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
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
                    <p className="text-sm font-semibold text-slate-900">{companyName}</p>
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
