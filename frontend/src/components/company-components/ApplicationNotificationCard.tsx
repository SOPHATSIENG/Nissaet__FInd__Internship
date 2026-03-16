import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, User, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApplicationNotificationCardProps {
  id: string;
  studentName: string;
  studentAvatar: string;
  internshipRole: string;
  message: string;
  time: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function ApplicationNotificationCard({
  id,
  studentName,
  studentAvatar,
  internshipRole,
  message,
  time,
  onApprove,
  onReject
}: ApplicationNotificationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={studentAvatar} 
                alt={studentName} 
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/10"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-background-dark p-1 rounded-full border-2 border-white">
                <MessageSquare size={10} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 leading-tight">{studentName}</h4>
              <p className="text-xs text-slate-500">Applied for <span className="text-primary font-medium">{internshipRole}</span></p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{time}</span>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4 relative">
          <div className="absolute -top-2 left-4 w-3 h-3 bg-slate-50 transform rotate-45 border-l border-t border-slate-50"></div>
          <p className="text-sm text-slate-600 italic leading-relaxed">
            "{message}"
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link 
            to={`/student/${id}`}
            className="text-xs font-bold text-slate-600 hover:text-primary flex items-center gap-1 transition-colors"
          >
            View Profile <ArrowRight size={14} />
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onReject}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Reject"
            >
              <XCircle size={18} />
            </button>
            <button 
              onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
              <CheckCircle size={14} />
              Shortlist
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
