import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    success: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    }
  };

  const activeColors = colors[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${activeColors.bg} ${activeColors.icon}`}>
                <AlertCircle size={24} />
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onConfirm}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeColors.button}`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
