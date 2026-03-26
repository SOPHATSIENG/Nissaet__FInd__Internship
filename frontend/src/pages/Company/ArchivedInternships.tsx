import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { History, MoreVertical, AlertTriangle, Search, RotateCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';

const formatDeadlineDate = (value?: string | null) => {
  if (!value) return 'No deadline';
  const trimmed = value.trim();
  if (!trimmed) return 'No deadline';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return 'No deadline';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ArchivedInternships() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const actionButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getCompanyArchivedInternships();
        const items = Array.isArray(res?.internships) ? res.internships : Array.isArray(res) ? res : [];
        if (mounted) setInternships(items);
      } catch (err) {
        console.error('Failed to load archived internships:', err);
        if (mounted) {
          setInternships([]);
          setError('Failed to load archived internships.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredInternships = internships.filter((job: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(job.title || '').toLowerCase().includes(q) ||
      String(job.location || '').toLowerCase().includes(q)
    );
  });

  const updateDropdownPosition = () => {
    if (!activeDropdown) return;
    const button = actionButtonRefs.current.get(activeDropdown);
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = 192;
    const padding = 8;
    const left = Math.max(padding, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - padding));
    const top = Math.min(rect.bottom - 4, window.innerHeight - padding);
    setDropdownPosition({ top, left });
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  useEffect(() => {
    if (!activeDropdown) {
      setDropdownPosition(null);
      return;
    }
    updateDropdownPosition();
    const handleReposition = () => updateDropdownPosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [activeDropdown]);

  const handleRestore = async (id: number) => {
    try {
      await api.restoreInternship(id);
      setInternships(prev => prev.filter(item => item.id !== id));
      setActiveDropdown(null);
    } catch (err) {
      console.error('Failed to restore internship:', err);
      alert('Failed to restore internship. Please try again.');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    const confirmed = window.confirm('Delete this archived internship permanently? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await api.permanentlyDeleteInternship(id);
      setInternships(prev => prev.filter(item => item.id !== id));
      setActiveDropdown(null);
    } catch (err) {
      console.error('Failed to permanently delete internship:', err);
      alert('Failed to delete internship. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
          <History size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Archived Internships</h1>
          <p className="text-slate-500 text-sm">Restore posts that were archived instead of deleted.</p>
          <p className="text-slate-400 text-xs mt-1">Archived internships are permanently deleted automatically after 1 month.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by title or location..."
          className="w-full text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle size={18} />
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <History size={32} />
              </div>
              <p className="text-slate-500 font-medium">No archived internships found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100">
                  <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Internship Title</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Posted Date</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Applicants</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {filteredInternships.map((job: any) => (
                    <motion.tr
                      key={job.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
                            {job.image ? (
                              <img src={job.image} alt={job.title} className="h-full w-full object-cover" />
                            ) : (
                              <History size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                            <p className="text-xs text-slate-500">{job.location} ? {job.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {formatDeadlineDate(job.application_deadline)}
                      </td>
                      <td className="py-4 px-6">
                        {((job.applicant_count ?? job.applications_count ?? 0) === 0) ? (
                          <span className="text-xs text-slate-400">No applicants</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
                              <span className="text-xs font-medium text-slate-500">{job.applicant_count ?? job.applications_count ?? 0}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset bg-slate-50 text-slate-600 ring-slate-200">
                          Archived
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="relative">
                          <button
                            ref={(el) => {
                              actionButtonRefs.current.set(job.id, el);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === job.id ? null : job.id);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                            title="More options"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {activeDropdown && dropdownPosition
        ? ReactDOM.createPortal(
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="fixed w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-[100] overflow-hidden"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleRestore(activeDropdown)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(activeDropdown)}
                  disabled={deletingId === activeDropdown}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingId === activeDropdown ? 'Deleting...' : 'Delete'}
                </button>
              </motion.div>
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}
