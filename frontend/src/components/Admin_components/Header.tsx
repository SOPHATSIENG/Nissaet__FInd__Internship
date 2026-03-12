import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, X, Check, Clock, AlertCircle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New User Registration',
    message: 'Sarah Johnson has registered as a new student.',
    time: '2 minutes ago',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'System Update',
    message: 'Platform maintenance scheduled for tonight at 2 AM.',
    time: '1 hour ago',
    read: false,
    type: 'warning',
  },
  {
    id: '3',
    title: 'Application Approved',
    message: 'Internship application #4829 has been approved.',
    time: '3 hours ago',
    read: true,
    type: 'success',
  },
  {
    id: '4',
    title: 'Database Backup Failed',
    message: 'Automatic backup failed due to connection timeout.',
    time: 'Yesterday',
    read: true,
    type: 'error',
  },
];

export const Header: React.FC<HeaderProps> = ({ title, children }) => {
  const { settings } = useProfile();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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
    <header className="sticky top-0 z-10 flex h-20 w-full items-center justify-between border-b border-gray-200 bg-white px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        {children || (
          <>
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary size-5 transition-colors group-focus-within:text-primary" />
              <input 
                className="h-11 w-72 rounded-2xl border border-border bg-background pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Search anything..." 
                type="text"
              />
            </div>
            
            {/* Notification Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative flex items-center justify-center size-11 rounded-2xl transition-all cursor-pointer border group",
                  showNotifications
                    ? "bg-blue-100 text-blue-600 border-blue-200 shadow-sm shadow-blue-600/20"
                    : "hover:bg-white hover:text-blue-600 hover:border-gray-300 hover:shadow-md hover:shadow-black/5 hover:scale-105 text-gray-500"
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
                    className="absolute right-0 mt-4 w-96 rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-text-primary">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            title="Mark all as read"
                          >
                            <Check className="size-3" /> Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            className="text-xs font-bold text-text-secondary hover:text-red-500 transition-colors flex items-center gap-1 ml-2"
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
                          <div className="size-12 rounded-full bg-background border border-border flex items-center justify-center mb-3">
                            <Bell className="size-6 text-text-secondary/50" />
                          </div>
                          <p className="text-sm font-bold text-text-primary">No notifications</p>
                          <p className="text-xs text-text-secondary mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={cn(
                                "relative p-4 border-b border-border last:border-0 hover:bg-background/50 transition-colors group",
                                !notification.read && "bg-primary/[0.02]"
                              )}
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
                                    <p className={cn("text-sm font-bold truncate", !notification.read ? "text-text-primary" : "text-text-secondary")}>
                                      {notification.title}
                                    </p>
                                    <span className="text-[10px] font-medium text-text-secondary shrink-0 flex items-center gap-1">
                                      <Clock className="size-3" /> {notification.time}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                    className="p-1.5 rounded-lg hover:bg-background text-primary hover:text-primary/80 transition-colors"
                                    title="Mark as read"
                                  >
                                    <div className="size-1.5 rounded-full bg-primary" />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors"
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
                    
                    <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm text-center">
                      <button className="text-xs font-bold text-text-secondary hover:text-primary transition-colors">
                        View All Activity
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
        
        <div className="h-8 w-px bg-border mx-2"></div>

        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 -m-2 rounded-xl transition-all hover:shadow-md hover:shadow-black/5 hover:scale-[1.02]"
          onClick={() => navigate('/profile')}
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-text-primary">{settings.name || 'Sophea Chan'}</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-wider">{settings.role || 'Super Admin'}</span>
          </div>
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 text-primary shadow-sm shadow-primary/5 overflow-hidden">
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

