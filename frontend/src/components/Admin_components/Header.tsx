import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, X, Check, Clock, AlertCircle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

interface Notification {
  id: number | string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string | null;
}

const timeAgo = (value?: string | null) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const mapType = (value?: string) => {
  if (value === 'application') return 'success';
  if (value === 'reminder') return 'warning';
  if (value === 'message') return 'info';
  if (value === 'system') return 'info';
  return 'info';
};

export const Header: React.FC<HeaderProps> = ({ title, children }) => {
  const { settings } = useProfile();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const isActivityFeed = true;

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      if (isActivityFeed) {
        const data = await api.adminGetDashboardOverview();
        const items = Array.isArray(data?.activity) ? data.activity : [];
        const mapped = items.map((item: any, idx: number) => ({
          id: `${item.title || 'activity'}-${item.time || idx}`,
          title: item.title || 'Activity',
          message: item.desc || '',
          time: timeAgo(item.time),
          read: false,
          type: mapType(item.type),
          actionUrl: null
        }));
        setNotifications(mapped);
        return;
      }

      const data = await api.getNotificationCard();
      const items = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data?.items) ? data.items : [];
      const mapped = items.map((item: any) => ({
        id: item.id,
        title: item.title || 'Notification',
        message: item.message || '',
        time: timeAgo(item.created_at),
        read: Boolean(item.is_read),
        type: mapType(item.type),
        actionUrl: item.action_url || null
      }));
      setNotifications(mapped);
    } catch (error) {
      // Keep existing notifications on error
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(id);
  }, []);

  const markAsRead = async (id: number | string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (isActivityFeed) return;
    try {
      await api.markNotificationsRead({ ids: [id] });
    } catch (error) {
      // Ignore failure
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (isActivityFeed) return;
    try {
      await api.markNotificationsRead({ all: true });
    } catch (error) {
      // Ignore failure
    }
  };

  const deleteNotification = async (id: number | string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (isActivityFeed) return;
    try {
      await api.deleteNotification(id);
    } catch (error) {
      // Ignore failure
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    if (isActivityFeed) return;
    try {
      await api.clearNotifications();
    } catch (error) {
      // Ignore failure
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="size-4 text-emerald-500" />;
      case 'warning': return <AlertCircle className="size-4 text-amber-500" />;
      case 'error': return <AlertCircle className="size-4 text-red-500" />;
      default: return <Info className="size-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-[72px] w-full items-center justify-between border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,252,0.94))] px-8 backdrop-blur-xl relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_34%)]" />
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        {children || (
          <>
            {/* <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary size-5 transition-colors group-focus-within:text-primary" />
              <input 
                className="h-11 w-72 rounded-2xl border border-border bg-background pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Search anything..." 
                type="text"
              />
            </div> */}
            
            {/* Notification Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative flex items-center justify-center size-11 rounded-2xl transition-all cursor-pointer border group bg-white/85",
                  showNotifications
                    ? "bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(236,254,255,0.95))] text-blue-700 border-blue-200 shadow-[0_12px_30px_-22px_rgba(37,99,235,0.65)]"
                    : "hover:-translate-y-0.5 hover:text-blue-600 hover:border-blue-200 text-slate-500"
                )}
              >
                <Bell className="size-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 size-2.5 rounded-full border-2 border-surface bg-red-500 shadow-sm shadow-red-500/40 animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-4 w-96 rounded-3xl border border-slate-200/70 bg-white shadow-2xl overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-slate-200/70 flex items-center justify-between bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(240,253,250,0.8))] backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 text-[10px] font-semibold border border-blue-200">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-600 transition-colors flex items-center gap-1"
                            title="Mark all as read"
                          >
                            <Check className="size-3" /> Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 ml-2"
                            title="Clear all notifications"
                          >
                            <Trash2 className="size-3" /> Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <div className="size-12 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-3">
                            <Bell className="size-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-900">No notifications</p>
                          <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={cn(
                                "relative p-4 border-b border-slate-200/70 last:border-0 hover:bg-slate-50 transition-colors group",
                                !notification.read && "bg-blue-600/[0.03]"
                              )}
                              onClick={() => {
                                if (!notification.read) markAsRead(notification.id);
                                if (notification.actionUrl) navigate(notification.actionUrl);
                              }}
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                                  notification.type === 'success' && "bg-emerald-500/10 border-emerald-500/20",
                                  notification.type === 'warning' && "bg-amber-500/10 border-amber-500/20",
                                  notification.type === 'error' && "bg-red-500/10 border-red-500/20",
                                  notification.type === 'info' && "bg-blue-500/10 border-blue-500/20",
                                )}>
                                  {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                  <p className={cn("text-sm font-semibold truncate", !notification.read ? "text-slate-900" : "text-slate-600")}>
                                    {notification.title}
                                  </p>
                                  <span className="text-[10px] font-medium text-slate-500 shrink-0 flex items-center gap-1">
                                    <Clock className="size-3" /> {notification.time}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                              
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                  className="p-1.5 rounded-lg hover:bg-slate-50 text-blue-700 transition-colors"
                                  title="Mark as read"
                                >
                                  <div className="size-1.5 rounded-full bg-blue-600" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-slate-200/70 bg-slate-50/70 backdrop-blur-sm text-center">
                      <button className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                        View All Activity
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
        
        <div className="h-8 w-px bg-slate-200/70 mx-2"></div>

        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-white/70 p-2 -m-2 rounded-xl transition-all hover:shadow-sm hover:shadow-black/5"
          onClick={() => navigate('/admin/profile')}
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900">{settings.name || 'Sophea Chan'}</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">{settings.role || 'Super Admin'}</span>
          </div>
          <div className="size-11 rounded-2xl bg-white/90 flex items-center justify-center border border-slate-200 text-slate-700 shadow-sm overflow-hidden">
            {settings.avatar ? (
              <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="size-6" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

