import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useNotifications } from '../../context/company-contexts/NotificationContext';
import { Notification } from '../../types';

const icons = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <XCircle className="w-5 h-5 text-rose-500" />,
};

const colors = {
  info: 'border-blue-100 bg-blue-50',
  success: 'border-emerald-100 bg-emerald-50',
  warning: 'border-amber-100 bg-amber-50',
  error: 'border-rose-100 bg-rose-50',
};

export const NotificationToasts: React.FC = () => {
  const { notifications } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setVisibleToasts((prev) => [latest, ...prev].slice(0, 3));
      
      const timer = setTimeout(() => {
        setVisibleToasts((prev) => prev.filter((t) => t.id !== latest.id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto w-80 p-4 rounded-xl border shadow-lg flex gap-3 ${colors[toast.type]}`}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setVisibleToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
