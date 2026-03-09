import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/company-contexts/NotificationContext';
import { useAuth } from '../../context/company-contexts/AuthContext';
import { NotificationType } from '../../types';

export const SenderPanel: React.FC = () => {
  const { sendNotification } = useNotifications();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !user) return;

    await sendNotification(user.uid, title, message, type);
    setTitle('');
    setMessage('');
  };

  const types: { value: NotificationType; icon: any; label: string; color: string }[] = [
    { value: 'info', icon: Info, label: 'Info', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'success', icon: CheckCircle2, label: 'Success', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { value: 'warning', icon: AlertTriangle, label: 'Warning', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'error', icon: AlertCircle, label: 'Error', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Send Alert</h2>
          <p className="text-sm text-slate-500">Broadcast a message to all connected users</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                type === t.value
                  ? `${t.color} scale-[1.02]`
                  : 'border-slate-100 bg-slate-50 text-slate-400 grayscale hover:grayscale-0 hover:border-slate-200'
              }`}
            >
              <t.icon className="w-6 h-6" />
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="System Update, New Message, etc."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to say?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!title || !message}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Broadcast Notification
        </button>
      </form>
    </div>
  );
};
