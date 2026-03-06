import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Trash2, Check, Clock, Inbox } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-xs font-normal text-slate-500">
                      ({unreadCount} new)
                    </span>
                  )}
                </h3>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Mark all read
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Inbox className="w-12 h-12 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 transition-colors hover:bg-slate-50 relative group ${
                          !notification.read ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className={`text-sm font-semibold ${!notification.read ? 'text-indigo-900' : 'text-slate-800'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 rounded-full bg-indigo-100 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
