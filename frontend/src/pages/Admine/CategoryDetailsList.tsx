import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ban, ArrowLeft, Briefcase, CalendarClock, CheckCircle, Edit2, Globe, MapPin, RefreshCw, Trash2, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';
import { cn } from '@/lib/utils';

const formatTypeLabel = (value?: string) => {
  if (!value) return 'n/a';
  return value.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

const formatCurrency = (value: number | string | null | undefined, currency?: string) => {
  if (value === null || value === undefined) return 'Negotiable';
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 'Negotiable';
  return `${currency || 'USD'} ${numberValue.toFixed(0)}`;
};

const normalizeInternships = (payload: any) => {
  const list =
    payload?.internships ||
    payload?.items ||
    payload?.data?.internships ||
    payload?.data?.items ||
    (Array.isArray(payload) ? payload : []);

  if (!Array.isArray(list)) return [];

  return list.map((item: any) => {
    const company = item?.company || item?.company_profile || {};
    return {
      ...item,
      company_name:
        item?.company_name ||
        company?.company_name ||
        company?.name ||
        item?.company?.name ||
        item?.company?.company_name ||
        item?.company_name ||
        item?.company ||
        '',
      company_logo:
        item?.company_logo ||
        company?.logo ||
        company?.company_logo ||
        item?.company?.logo ||
        item?.company?.company_logo ||
        '',
      company_industry: item?.company_industry || company?.industry || '',
      company_location: item?.company_location || company?.location || '',
      company_website: item?.company_website || company?.website || '',
    };
  });
};

export const CategoryDetailsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');

  const [categoryName, setCategoryName] = useState('');
  const [internships, setInternships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingInternship, setEditingInternship] = useState<any>(null);
  const [formState, setFormState] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'clean'>('all');

  const loadCategory = async (options?: { withMeta?: boolean; showLoading?: boolean }) => {
    if (!categoryId) return;
    const { withMeta = true, showLoading = true } = options || {};

    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsSaving(true);
    }

    setErrorMessage('');
    try {
      if (withMeta) {
        const [categoryRes, internshipsRes] = await Promise.all([
          api.adminGetCategories(),
          api.adminGetCategoryInternships(categoryId, { limit: 1000, page: 1 }),
        ]);

        const categories = categoryRes?.categories || [];
        const selected = categories.find((cat: any) => String(cat.id) === String(categoryId));
        if (!selected) {
          setCategoryName('Category');
          setInternships([]);
          setErrorMessage('This category no longer exists. It may have been deleted.');
          return;
        }
        setCategoryName(selected?.name || 'Category');
        setInternships(normalizeInternships(internshipsRes));
      } else {
        const internshipsRes = await api.adminGetCategoryInternships(categoryId, { limit: 1000, page: 1 });
        setInternships(normalizeInternships(internshipsRes));
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to load internships.');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    loadCategory({ withMeta: true, showLoading: true });
  }, [categoryId]);

  const openEdit = async (id: string) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const res = await api.adminGetInternship(id);
      const internship = res?.internship;
      if (!internship) {
        setErrorMessage('Unable to load internship details.');
        return;
      }
      setEditingInternship(internship);
      setFormState({
        title: internship.title || '',
        description: internship.description || '',
        requirements: internship.requirements || '',
        location: internship.location || '',
        type: internship.type || internship.work_mode || 'full-time',
        duration_months: internship.duration_months || internship.duration || '',
        stipend: internship.stipend ?? 0,
        stipend_currency: internship.stipend_currency || 'USD',
        positions: internship.positions ?? 1,
        application_deadline: internship.application_deadline
          ? internship.application_deadline.slice(0, 10)
          : '',
        start_date: internship.start_date ? internship.start_date.slice(0, 10) : '',
        end_date: internship.end_date ? internship.end_date.slice(0, 10) : '',
        skills: Array.isArray(internship.skills)
          ? internship.skills.map((s: any) => s.name).join(', ')
          : '',
      });
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to load internship details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      try {
        await api.adminDeleteInternship(id);
      } catch (error: any) {
        // Fallback to shared internship delete endpoint (admin is authorized there too)
        await api.deleteInternship(id);
      }
      setInternships((prev) => prev.filter((item) => String(item.id) !== String(id)));
      if (editingInternship && String(editingInternship.id) === String(id)) {
        setEditingInternship(null);
        setFormState(null);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to delete internship.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlag = async (id: string) => {
    const reason = window.prompt('Reason for banning (optional):') || '';
    setIsSaving(true);
    setErrorMessage('');
    try {
      await api.adminFlagInternship(id, { reason });
      setInternships((prev) =>
        prev.map((item) =>
          String(item.id) === String(id)
            ? { ...item, is_flagged: true, flag_reason: reason || item.flag_reason }
            : item
        )
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to ban internship.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnflag = async (id: string) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      await api.adminUnflagInternship(id);
      setInternships((prev) =>
        prev.map((item) =>
          String(item.id) === String(id)
            ? { ...item, is_flagged: false, flag_reason: '' }
            : item
        )
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to unban internship.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInternship || !formState) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      const skills = formState.skills
        ? formState.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formState.title,
        description: formState.description,
        requirements: formState.requirements,
        location: formState.location,
        type: formState.type,
        duration_months: Number(formState.duration_months) || null,
        stipend: Number(formState.stipend) || 0,
        stipend_currency: formState.stipend_currency || 'USD',
        positions: Number(formState.positions) || 1,
        application_deadline: formState.application_deadline || null,
        start_date: formState.start_date || null,
        end_date: formState.end_date || null,
        skills,
      };

      const res = await api.adminUpdateInternship(editingInternship.id, payload);
      const updatedFromApi = res?.internship || res?.data?.internship || null;
      const updatedInternship = updatedFromApi || {
        ...editingInternship,
        ...payload,
        skills: payload.skills,
      };

      setInternships((prev) =>
        prev.map((item) =>
          String(item.id) === String(editingInternship.id)
            ? { ...item, ...updatedInternship }
            : item
        )
      );

      setEditingInternship(null);
      setFormState(null);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to update internship.');
    } finally {
      setIsSaving(false);
    }
  };

  const grouped = useMemo(() => {
    if (filter === 'flagged') return internships.filter((item) => item.is_flagged);
    if (filter === 'clean') return internships.filter((item) => !item.is_flagged);
    return internships;
  }, [internships, filter]);

  return (
    <div className="admin-page">
      {!categoryId && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary flex items-center justify-between">
          <span>No category selected.</span>
          <button
            onClick={() => navigate('/admin/categories')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            Back to Categories
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Category Management
          </button>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Active Internships in {categoryName || 'Category'}
          </h1>
          <p className="text-text-secondary text-base">
            Admin can edit or delete internships linked to this category.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'clean', label: 'Clean' },
              { id: 'flagged', label: 'Banned' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as typeof filter)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  filter === item.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadCategory({ withMeta: false, showLoading: false })}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold transition-all",
              isSaving ? "text-text-secondary/50 cursor-not-allowed" : "text-text-secondary hover:text-primary hover:border-primary"
            )}
          >
            <RefreshCw className={cn("size-4", isSaving && "animate-spin")} />
            {isSaving ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      {isSaving && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Processing request...
        </div>
      )}

      {isLoading ? (
        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-center">
          <div className="size-16 rounded-full bg-background border border-border flex items-center justify-center">
            <Briefcase className="size-8 text-text-secondary opacity-40" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-text-primary">Loading internships...</h3>
            <p className="text-sm text-text-secondary">Fetching the latest data from your database.</p>
          </div>
        </div>
      ) : grouped.length === 0 ? (
        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-center">
          <div className="size-16 rounded-full bg-background border border-border flex items-center justify-center">
            <Briefcase className="size-8 text-text-secondary opacity-20" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-text-primary">
              {errorMessage ? 'Category not found' : 'No internships found'}
            </h3>
            <p className="text-sm text-text-secondary">
              {errorMessage
                ? 'Return to Category Management to pick another category.'
                : 'Try again later or update company categories.'}
            </p>
            {errorMessage && (
              <button
                onClick={() => navigate('/admin/categories')}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
              >
                Back to Categories
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grouped.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-text-primary">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    {item.company_logo ? (
                      <img
                        src={item.company_logo}
                        alt={item.company_name}
                        className="size-6 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="size-6 rounded-full border border-border bg-background" />
                    )}
                    <span className="font-semibold text-text-primary">{item.company_name}</span>
                    {item.company_industry && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-border bg-background text-text-secondary">
                        {item.company_industry}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.is_flagged ? (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-red-200 bg-red-50 text-red-600">
                      Banned
                    </span>
                  ) : null}
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-border bg-background text-text-secondary">
                    {formatTypeLabel(item.type)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-text-secondary text-xs">
                <MapPin className="size-3" />
                {item.location || item.company_location || 'No location'}
              </div>
              {item.company_website && (
                <div className="mt-2 flex items-center gap-2 text-text-secondary text-xs">
                  <Globe className="size-3" />
                  <span>{item.company_website}</span>
                </div>
              )}
              {item.description && (
                <p className="mt-3 text-xs text-text-secondary leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              )}
              {item.requirements && (
                <p className="mt-2 text-xs text-text-secondary leading-relaxed line-clamp-2">
                  <span className="font-semibold text-text-primary">Requirements:</span> {item.requirements}
                </p>
              )}
              {item.is_flagged && item.flag_reason && (
                <p className="mt-2 text-xs text-red-600 leading-relaxed">
                  <span className="font-semibold">Ban reason:</span> {item.flag_reason}
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <Users className="size-3" />
                  {Number(item.positions) > 0 ? (
                    <span>{`${item.positions} positions`}</span>
                  ) : (
                    <span className="inline-flex items-center text-text-secondary">
                      <Ban className="size-3" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="size-3" />
                  {Number(item.stipend) > 0 ? (
                    <span>{formatCurrency(item.stipend, item.stipend_currency)}</span>
                  ) : (
                    <span className="inline-flex items-center text-text-secondary">
                      <Ban className="size-3" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-3" />
                  <span>
                    {item.application_deadline
                      ? new Date(item.application_deadline).toLocaleDateString()
                      : 'No deadline'}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Posted {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'n/a'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFlag(item.id)}
                    disabled={!!item.is_flagged || isSaving}
                    className={cn(
                      "p-2 rounded-lg border border-border transition-all",
                      item.is_flagged
                        ? "text-red-300 bg-red-50 cursor-not-allowed"
                        : isSaving
                          ? "text-text-secondary/50 cursor-not-allowed"
                          : "text-text-secondary hover:text-red-500 hover:bg-red-50"
                    )}
                    title="Ban inappropriate content"
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                  </button>
                  {item.is_flagged && (
                    <button
                      onClick={() => handleUnflag(item.id)}
                      disabled={isSaving}
                      className={cn(
                        "p-2 rounded-lg border border-border transition-all",
                        isSaving ? "text-emerald-300 cursor-not-allowed" : "text-emerald-600 hover:bg-emerald-50"
                      )}
                      title="Unban internship"
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(item.id)}
                    disabled={isSaving}
                    className={cn(
                      "p-2 rounded-lg border border-border transition-all",
                      isSaving ? "text-text-secondary/50 cursor-not-allowed" : "text-text-secondary hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Edit2 className="size-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isSaving}
                    className={cn(
                      "p-2 rounded-lg border border-border transition-all",
                      isSaving ? "text-text-secondary/50 cursor-not-allowed" : "text-text-secondary hover:text-red-500 hover:bg-red-50"
                    )}
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editingInternship && formState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingInternship(null);
                setFormState(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-background/70">
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Edit2 className="size-5" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">Edit Internship</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingInternship(null);
                    setFormState(null);
                  }}
                  disabled={isSaving}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isSaving ? "text-text-secondary/50 cursor-not-allowed" : "text-text-secondary hover:text-text-primary hover:bg-background"
                  )}
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Basic Info</p>
                    <p className="text-sm text-text-secondary">Update the title, location, type, and duration.</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-border bg-background text-text-secondary">
                    {formatTypeLabel(formState.type)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Title</label>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Location</label>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Type</label>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.type}
                      onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Duration (months)</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.duration_months}
                      onChange={(e) => setFormState({ ...formState, duration_months: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Description</p>
                  <label className="text-sm font-bold text-text-primary">Description</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Requirements</p>
                  <label className="text-sm font-bold text-text-primary">Requirements</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formState.requirements}
                    onChange={(e) => setFormState({ ...formState, requirements: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Compensation</p>
                    <p className="text-sm text-text-secondary">Stipend, currency, and positions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Stipend</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.stipend}
                      onChange={(e) => setFormState({ ...formState, stipend: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Currency</label>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.stipend_currency}
                      onChange={(e) => setFormState({ ...formState, stipend_currency: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Timeline</p>
                    <p className="text-sm text-text-secondary">Key dates for the internship.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Positions</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.positions}
                      onChange={(e) => setFormState({ ...formState, positions: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Deadline</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.application_deadline}
                      onChange={(e) => setFormState({ ...formState, application_deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Start Date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.start_date}
                      onChange={(e) => setFormState({ ...formState, start_date: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">End Date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formState.end_date}
                      onChange={(e) => setFormState({ ...formState, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Skills</p>
                  <label className="text-sm font-bold text-text-primary">Skills (comma-separated)</label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={formState.skills}
                    onChange={(e) => setFormState({ ...formState, skills: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInternship(null);
                      setFormState(null);
                    }}
                    disabled={isSaving}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold transition-colors",
                      isSaving ? "text-text-secondary/50 cursor-not-allowed" : "text-text-secondary hover:bg-background"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={cn(
                      "px-8 py-2.5 rounded-xl text-sm font-black shadow-lg transition-all transform active:scale-95",
                      isSaving ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-primary text-white hover:opacity-90 hover:shadow-xl"
                    )}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
