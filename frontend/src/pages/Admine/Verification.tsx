import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  ChevronDown,
  Check,
  X,
  History,
  ShieldCheck,
  ExternalLink,
  MoreHorizontal,
  Mail,
  Building2,
  Calendar,
  BadgeCheck,
  Eye,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  MapPin,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import api from '../../api/axios';

const INDUSTRIES = ['Software Dev', 'Agriculture', 'Marketing', 'Logistics', 'Finance', 'Education', 'Healthcare'];
const STATUSES = ['pending', 'approved', 'rejected'];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
  { label: 'Company Name (A-Z)', value: 'name-asc' },
  { label: 'Company Name (Z-A)', value: 'name-desc' },
];

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const Verification = () => {
  const { user } = useAuth();
  const { settings } = useProfile();
  const isCompanyUser = user?.role === 'company';
  const [companyQueue, setCompanyQueue] = useState<any[]>([]);
  const [studentQueue, setStudentQueue] = useState<any[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [activeType, setActiveType] = useState<'student' | 'company'>('company');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date-desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCompanyFilterOpen, setIsCompanyFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterAction, setHistoryFilterAction] = useState<'all' | 'approved' | 'rejected'>('all');
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'student' | 'company'>('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isCompanyUser) {
      setActiveType('company');
      setSelectedItem(null);
    }
  }, [isCompanyUser]);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsQueueLoading(true);
        setQueueError('');
        const [companyResult, studentResult] = await Promise.allSettled([
          api.adminGetCompanyVerifications(),
          api.adminGetStudentVerifications()
        ]);

        if (companyResult.status === 'fulfilled') {
          setCompanyQueue(Array.isArray(companyResult.value) ? companyResult.value : []);
        }
        if (studentResult.status === 'fulfilled') {
          setStudentQueue(Array.isArray(studentResult.value) ? studentResult.value : []);
        }

        if (companyResult.status === 'rejected' && studentResult.status === 'rejected') {
          setQueueError('Failed to load verification requests.');
        }
      } catch (error) {
        console.error(error);
        setQueueError('Failed to load verification requests.');
      } finally {
        setIsQueueLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  const handleAction = (action: 'approve' | 'reject') => {
    setConfirmAction(action);
  };

  const confirmFinalAction = async () => {
    if (confirmAction === 'reject' && !rejectionReason.trim()) {
      return;
    }
    
    // Add to history
    if (selectedItem) {
      const nextStatus = confirmAction === 'approve' ? 'approved' : 'rejected';
      if (selectedItem.type === 'company' && selectedItem.rawId) {
        try {
          await api.adminUpdateCompanyVerification(selectedItem.rawId, {
            status: nextStatus,
            rejection_reason: rejectionReason
          });
          setCompanyQueue(prev =>
            prev.map(item => (item.id === selectedItem.rawId
              ? {
                  ...item,
                  status: nextStatus,
                  reviewed_at: new Date().toISOString(),
                  reviewed_by_name: settings?.name || 'Admin'
                }
              : item))
          );
        } catch (error) {
          console.error(error);
        }
      }
      if (selectedItem.type === 'student' && selectedItem.rawId) {
        try {
          await api.adminUpdateStudentVerification(selectedItem.rawId, {
            status: nextStatus,
            rejection_reason: rejectionReason
          });
          setStudentQueue(prev =>
            prev.map(item => (item.id === selectedItem.rawId
              ? {
                  ...item,
                  status: nextStatus,
                  reviewed_at: new Date().toISOString(),
                  reviewed_by_name: settings?.name || 'Admin'
                }
              : item))
          );
        } catch (error) {
          console.error(error);
        }
      }

      setSelectedItem(prev => (prev ? { ...prev, status: nextStatus } : prev));
    }
    
    // In a real app, we would call an API here
    setShowSuccess(true);
    setConfirmAction(null);
    setRejectionReason('');
    
    // Auto hide success message and clear selection
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedItem(null);
    }, 3000);
  };

  const normalizedCompanyQueue = useMemo(() => {
    return companyQueue.map(item => {
      const name = item.company_name || item.user_name || 'Company';
      return {
        id: `#CMP-${item.id}`,
        rawId: item.id,
        type: 'company',
        name,
        industry: item.industry || 'General',
        date: formatDate(item.submitted_at),
        time: formatTime(item.submitted_at),
        docs: Array.isArray(item.documents) ? item.documents : [],
        initial: name.charAt(0).toUpperCase(),
        color: item.status === 'approved'
          ? 'bg-emerald-500/10 text-emerald-500'
          : item.status === 'rejected'
          ? 'bg-rose-500/10 text-rose-500'
          : 'bg-blue-500/10 text-blue-500',
        status: item.status,
        email: item.contact_email || item.user_email || '',
        contact_person: item.contact_person || item.user_name || '',
        website: item.website || '',
        location: item.location || '',
        notes: item.notes || '',
        rejection_reason: item.rejection_reason || '',
        reviewed_at: item.reviewed_at || '',
        reviewed_by_name: item.reviewed_by_name || '',
        submitted_at_raw: item.submitted_at || '',
        reviewed_at_raw: item.reviewed_at || ''
      };
    });
  }, [companyQueue]);

  const normalizedStudentQueue = useMemo(() => {
    return studentQueue.map(item => {
      const name = item.student_name || item.user_name || 'Student';
      const major = item.major || item.university || 'General';
      return {
        id: `#STU-${item.id}`,
        rawId: item.id,
        type: 'student',
        name,
        industry: major,
        date: formatDate(item.submitted_at),
        time: formatTime(item.submitted_at),
        docs: Array.isArray(item.documents) ? item.documents : [],
        initial: name.charAt(0).toUpperCase(),
        color: item.status === 'approved'
          ? 'bg-emerald-500/10 text-emerald-500'
          : item.status === 'rejected'
          ? 'bg-rose-500/10 text-rose-500'
          : 'bg-emerald-500/10 text-emerald-500',
        status: item.status,
        email: item.contact_email || item.user_email || '',
        university: item.university || '',
        major: item.major || '',
        graduation_year: item.graduation_year || '',
        notes: item.notes || '',
        rejection_reason: item.rejection_reason || '',
        reviewed_at: item.reviewed_at || '',
        reviewed_by_name: item.reviewed_by_name || '',
        submitted_at_raw: item.submitted_at || '',
        reviewed_at_raw: item.reviewed_at || ''
      };
    });
  }, [studentQueue]);

  const historyItems = useMemo(() => {
    const merged = [...normalizedCompanyQueue, ...normalizedStudentQueue]
      .filter(item => item.status !== 'pending')
      .map(item => {
        const reviewedAt = item.reviewed_at || '';
        const date = reviewedAt ? formatDate(reviewedAt) : item.date;
        const time = reviewedAt ? formatTime(reviewedAt) : item.time;
        return {
          id: `H-${item.type}-${item.rawId}`,
          entity: item.name,
          type: item.type,
          action: item.status,
          admin: item.reviewed_by_name || settings?.name || 'Admin',
          date,
          time,
          notes: item.status === 'rejected'
            ? (item.rejection_reason || 'Rejected by reviewer.')
            : (item.notes || 'Manual review completed.')
        };
      });

    return merged.sort((a, b) => {
      const ad = new Date(`${a.date} ${a.time}`).getTime();
      const bd = new Date(`${b.date} ${b.time}`).getTime();
      return bd - ad;
    });
  }, [normalizedCompanyQueue, normalizedStudentQueue, settings?.name]);

  const visibleQueue = useMemo(() => {
    const mergedQueue = [
      ...normalizedStudentQueue,
      ...normalizedCompanyQueue
    ];

    if (!isCompanyUser) return mergedQueue;

    let result = mergedQueue.filter(item => item.type === 'company');
    if (user?.email) {
      const email = user.email.toLowerCase();
      result = result.filter(item => (item.email || '').toLowerCase() === email);
    }
    return result;
  }, [normalizedCompanyQueue, normalizedStudentQueue, isCompanyUser, user?.email]);

  const stats = useMemo(() => {
    const scoped = visibleQueue.filter(item => item.type === activeType);
    const totalVerified = scoped.filter(item => item.status === 'approved').length;
    const totalRejected = scoped.filter(item => item.status === 'rejected').length;
    const totalPending = scoped.filter(item => item.status === 'pending').length;

    const reviewedItems = scoped.filter(item => item.reviewed_at_raw);
    const totalHours = reviewedItems.reduce((sum, item) => {
      const submittedAt = new Date(item.submitted_at_raw);
      const reviewedAt = new Date(item.reviewed_at_raw);
      if (Number.isNaN(submittedAt.getTime()) || Number.isNaN(reviewedAt.getTime())) {
        return sum;
      }
      return sum + (reviewedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
    }, 0);
    const avgHours = reviewedItems.length > 0 ? totalHours / reviewedItems.length : 0;

    return {
      totalVerified,
      totalRejected,
      totalPending,
      avgResponse: reviewedItems.length > 0 ? `${avgHours.toFixed(1)}h` : '—'
    };
  }, [visibleQueue, activeType]);

  const ENTITIES = useMemo(() => {
    return Array.from(new Set(visibleQueue.filter(item => item.type === activeType).map(item => item.name)));
  }, [visibleQueue, activeType]);

  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const filteredAndSortedQueue = useMemo(() => {
    let result = visibleQueue.filter(item => {
      const matchesType = item.type === activeType;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(item.industry);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      const matchesCompany = selectedCompanies.length === 0 || selectedCompanies.includes(item.name);
      return matchesType && matchesSearch && matchesIndustry && matchesStatus && matchesCompany;
    });

    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0;
    });

    return result;
  }, [visibleQueue, searchQuery, selectedIndustries, selectedStatuses, selectedCompanies, sortBy, activeType]);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-8 gap-8 overflow-y-auto no-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Security Layer</div>
            <div className="w-1 h-1 rounded-full bg-border"></div>
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">v2.4.0</div>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Verification Center</h1>
          <p className="text-text-secondary text-lg">Manage and validate {activeType === 'student' ? 'student' : 'enterprise'} credentials.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-text-primary tracking-tight">
              {visibleQueue.filter(i => i.type === activeType && i.status === 'pending').length} Pending
            </span>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Awaiting Review</span>
          </div>
          <div className="w-px h-10 bg-border mx-2"></div>
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <History className="size-4" /> View History
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Verified', value: stats.totalVerified.toString(), icon: BadgeCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Pending Review', value: stats.totalPending.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Rejected', value: stats.totalRejected.toString(), icon: X, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Avg. Response', value: stats.avgResponse, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 p-5 rounded-3xl border border-border bg-surface shadow-sm">
            <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
              <stat.icon className="size-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{stat.label}</span>
              <span className="text-2xl font-black text-text-primary tracking-tight">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Type Toggle Filters */}
      <div className="flex items-center gap-2 p-1.5 bg-surface border border-border rounded-2xl w-fit self-center shadow-sm">
        {!isCompanyUser && (
          <>
            <button 
              onClick={() => {
                setActiveType('student');
                setSelectedItem(null);
              }}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3 relative overflow-hidden group",
                activeType === 'student' 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400" 
                  : "text-text-secondary hover:bg-emerald-50 hover:text-emerald-600"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                activeType === 'student' ? "bg-white/20" : "bg-emerald-100/50 text-emerald-600 group-hover:bg-emerald-100"
              )}>
                <GraduationCap className="size-5" />
              </div>
              <div className="flex flex-col items-start leading-none gap-1">
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", activeType === 'student' ? "text-emerald-100" : "text-text-secondary/60")}>Individual</span>
                <span>Student</span>
              </div>
            </button>
            
            <div className="w-px h-8 bg-border mx-1"></div>
          </>
        )}

        <button 
          onClick={() => {
            setActiveType('company');
            setSelectedItem(null);
          }}
          className={cn(
            "px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3 relative overflow-hidden group",
            activeType === 'company' 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-500" 
              : "text-text-secondary hover:bg-blue-50 hover:text-blue-600"
          )}
        >
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            activeType === 'company' ? "bg-white/20" : "bg-blue-100/50 text-blue-600 group-hover:bg-blue-100"
          )}>
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col items-start leading-none gap-1">
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", activeType === 'company' ? "text-blue-100" : "text-text-secondary/60")}>Enterprise</span>
            <span>Company</span>
          </div>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Queue Section */}
        <div className="flex flex-col flex-1 gap-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary size-4" />
              <input 
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none transition-all" 
                placeholder={activeType === 'student' ? "Search by student name or ID..." : "Search by company name or ID..."} 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* Industry Filter */}
              <div className="relative flex-1 sm:flex-none">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 px-5 rounded-xl border transition-all text-sm font-bold",
                    selectedIndustries.length > 0
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-text-secondary hover:border-primary"
                  )}
                >
                  <Filter className="size-4" />
                  Industry
                  {selectedIndustries.length > 0 && (
                    <span className="flex items-center justify-center size-5 rounded-full bg-primary text-white text-[10px]">
                      {selectedIndustries.length}
                    </span>
                  )}
                  <ChevronDown className={cn("size-4 transition-transform", isFilterOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-20 p-4 flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Industries</p>
                          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                            {INDUSTRIES.map(industry => (
                              <button 
                                key={industry}
                                onClick={() => toggleFilter(selectedIndustries, setSelectedIndustries, industry)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors text-sm"
                              >
                                <span className={cn(selectedIndustries.includes(industry) ? "text-primary font-bold" : "text-text-secondary")}>
                                  {industry}
                                </span>
                                {selectedIndustries.includes(industry) && <Check className="size-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {selectedIndustries.length > 0 && (
                          <button 
                            onClick={() => setSelectedIndustries([])}
                            className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors border-t border-border mt-2"
                          >
                            Clear All
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Filter */}
              <div className="relative flex-1 sm:flex-none">
                <button 
                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 px-5 rounded-xl border transition-all text-sm font-bold",
                    selectedStatuses.length > 0
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-text-secondary hover:border-primary"
                  )}
                >
                  <ShieldCheck className="size-4" />
                  Status
                  {selectedStatuses.length > 0 && (
                    <span className="flex items-center justify-center size-5 rounded-full bg-primary text-white text-[10px]">
                      {selectedStatuses.length}
                    </span>
                  )}
                  <ChevronDown className={cn("size-4 transition-transform", isStatusFilterOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isStatusFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-20 p-4 flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Status</p>
                          <div className="flex flex-col gap-1">
                            {STATUSES.map(status => (
                              <button 
                                key={status}
                                onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors text-sm"
                              >
                                <span className={cn("capitalize", selectedStatuses.includes(status) ? "text-primary font-bold" : "text-text-secondary")}>
                                  {status}
                                </span>
                                {selectedStatuses.includes(status) && <Check className="size-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {selectedStatuses.length > 0 && (
                          <button 
                            onClick={() => setSelectedStatuses([])}
                            className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors border-t border-border mt-2"
                          >
                            Clear All
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Entity Filter */}
              <div className="relative flex-1 sm:flex-none">
                <button 
                  onClick={() => setIsCompanyFilterOpen(!isCompanyFilterOpen)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 px-5 rounded-xl border transition-all text-sm font-bold",
                    selectedCompanies.length > 0
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-text-secondary hover:border-primary"
                  )}
                >
                  {activeType === 'student' ? <GraduationCap className="size-4" /> : <Building2 className="size-4" />}
                  {activeType === 'student' ? 'Student' : 'Company'}
                  {selectedCompanies.length > 0 && (
                    <span className="flex items-center justify-center size-5 rounded-full bg-primary text-white text-[10px]">
                      {selectedCompanies.length}
                    </span>
                  )}
                  <ChevronDown className={cn("size-4 transition-transform", isCompanyFilterOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isCompanyFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsCompanyFilterOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-20 p-4 flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-black text-text-secondary uppercase tracking-widest">{activeType === 'student' ? 'Students' : 'Companies'}</p>
                          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto no-scrollbar">
                            {ENTITIES.map(entity => (
                              <button 
                                key={entity}
                                onClick={() => toggleFilter(selectedCompanies, setSelectedCompanies, entity)}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-background transition-colors text-sm"
                              >
                                <span className={cn("truncate max-w-[200px]", selectedCompanies.includes(entity) ? "text-primary font-bold" : "text-text-secondary")}>
                                  {entity}
                                </span>
                                {selectedCompanies.includes(entity) && <Check className="size-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {selectedCompanies.length > 0 && (
                          <button 
                            onClick={() => setSelectedCompanies([])}
                            className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors border-t border-border mt-2"
                          >
                            Clear All
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-border bg-background text-text-secondary hover:border-primary transition-all text-sm font-bold"
              >
                <ArrowUpDown className="size-4" />
                Sort
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex flex-col rounded-[2rem] border border-border bg-surface shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="p-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      {activeType === 'student' ? 'Student Applicant' : 'Enterprise Entity'}
                    </th>
                    <th className="p-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      {activeType === 'student' ? 'Major / Department' : 'Industry Sector'}
                    </th>
                    <th className="p-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">Submission Date</th>
                    <th className="p-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">Credentials</th>
                    <th className="p-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">Status</th>
                    <th className="p-5 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isQueueLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-secondary text-sm font-bold">
                        Loading verification requests...
                      </td>
                    </tr>
                  ) : queueError ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-rose-600 text-sm font-bold">
                        {queueError}
                      </td>
                    </tr>
                  ) : filteredAndSortedQueue.length > 0 ? (
                    filteredAndSortedQueue.map((item) => (
                      <tr 
                        key={item.id} 
                        className={cn(
                          "group hover:bg-background/50 transition-colors cursor-pointer",
                          selectedItem?.id === item.id && "bg-primary/5"
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={cn("size-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm", item.color)}>
                            {item.initial}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-text-primary tracking-tight">{item.name}</span>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{item.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          {activeType === 'student' ? <GraduationCap className="size-4 text-emerald-500" /> : <Building2 className="size-4 text-blue-500" />}
                          <span className="text-sm font-bold text-text-primary">{item.industry}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-primary">{item.date}</span>
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{item.time}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          {item.docs.length > 0 ? (
                            <div className="flex -space-x-2">
                              {item.docs.map((doc, i) => (
                                <div key={i} className="size-8 rounded-lg bg-surface border-2 border-background flex items-center justify-center shadow-sm" title={doc}>
                                  <FileText className="size-4 text-text-secondary" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded">Missing Docs</span>
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                          item.status === 'approved' && "bg-emerald-500/10 text-emerald-500",
                          item.status === 'pending' && "bg-amber-500/10 text-amber-500",
                          item.status === 'rejected' && "bg-rose-500/10 text-rose-500"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-xl border border-border bg-surface text-text-secondary hover:text-primary hover:border-primary transition-all">
                            <Eye className="size-4" />
                          </button>
                          <button className="p-2 rounded-xl border border-border bg-surface text-text-secondary hover:text-emerald-500 hover:border-emerald-500 transition-all">
                            <Check className="size-4" />
                          </button>
                        </div>
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-secondary text-sm font-bold">
                        No verification requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border bg-background/30 p-5">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  Showing <span className="text-text-primary">{filteredAndSortedQueue.length}</span> of <span className="text-text-primary">{visibleQueue.length}</span> entities
                </span>
                {(selectedIndustries.length > 0 || selectedStatuses.length > 0 || selectedCompanies.length > 0) && (
                  <button 
                    onClick={() => {
                      setSelectedIndustries([]);
                      setSelectedStatuses([]);
                      setSelectedCompanies([]);
                    }}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button className="h-8 px-3 rounded-lg border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-all disabled:opacity-50" disabled>Prev</button>
                <button className="size-8 rounded-lg bg-primary text-white text-[10px] font-black">1</button>
                <button className="size-8 rounded-lg border border-border bg-surface text-[10px] font-black text-text-secondary hover:text-primary transition-all">2</button>
                <button className="h-8 px-3 rounded-lg border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-all">Next</button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div 
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-8 p-8 rounded-[2rem] border border-border bg-surface shadow-xl relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <ShieldCheck className="size-48 text-primary" />
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={cn("size-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-lg", selectedItem.color)}>
                      {selectedItem.initial}
                    </div>
                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="p-2 rounded-xl hover:bg-background transition-colors"
                    >
                      <X className="size-5 text-text-secondary" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">{selectedItem.name}</h2>
                    <div className="flex items-center gap-2">
                      {selectedItem.type === 'student' ? <GraduationCap className="size-4 text-primary" /> : <Building2 className="size-4 text-primary" />}
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{selectedItem.industry}</span>
                      <div className="w-1 h-1 rounded-full bg-border"></div>
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{selectedItem.id}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                      <Mail className="size-5 text-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Contact Email</span>
                        <span className="text-sm font-bold text-text-primary truncate">{selectedItem.email}</span>
                      </div>
                    </div>
                    {selectedItem.type === 'student' && (
                      <>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                          <Building2 className="size-5 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">University</span>
                            <span className="text-sm font-bold text-text-primary truncate">{(selectedItem as any).university || 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                          <Briefcase className="size-5 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Major</span>
                            <span className="text-sm font-bold text-text-primary truncate">{(selectedItem as any).major || 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                          <Calendar className="size-5 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Graduation Year</span>
                            <span className="text-sm font-bold text-text-primary truncate">{(selectedItem as any).graduation_year || 'Not provided'}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedItem.type === 'company' && (
                      <>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                          <User className="size-5 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Contact Person</span>
                            <span className="text-sm font-bold text-text-primary truncate">{(selectedItem as any).contact_person || 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                          <MapPin className="size-5 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Location</span>
                            <span className="text-sm font-bold text-text-primary truncate">{(selectedItem as any).location || 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                          <ExternalLink className="size-5 text-primary shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Website</span>
                            <span className="text-sm font-bold text-text-primary truncate">{(selectedItem as any).website || 'Not provided'}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                      <Calendar className="size-5 text-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Applied Date</span>
                        <span className="text-sm font-bold text-text-primary">{selectedItem.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Submitted Documents</h3>
                    <div className="flex flex-col gap-2">
                      {selectedItem.docs.length > 0 ? selectedItem.docs.map(doc => (
                        <div key={doc} className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-all group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <FileText className="size-4 text-primary" />
                            <span className="text-sm font-bold text-text-primary">{doc}</span>
                          </div>
                          <ExternalLink className="size-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )) : (
                        <div className="p-4 rounded-xl border border-dashed border-rose-200 bg-rose-50 flex flex-col items-center gap-2 text-center">
                          <AlertCircle className="size-6 text-rose-500" />
                          <p className="text-xs font-bold text-rose-600">No verification documents have been uploaded yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-border">
                    <AnimatePresence mode="wait">
                      {showSuccess ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-center"
                        >
                          <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Check className="size-6 text-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-emerald-900">Action Successful</p>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                              The application has been {confirmAction === 'reject' ? 'rejected' : 'approved'} successfully.
                            </p>
                          </div>
                        </motion.div>
                      ) : confirmAction ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex flex-col gap-4 p-5 rounded-2xl bg-background border border-border shadow-inner"
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className={cn("size-4", confirmAction === 'approve' ? "text-primary" : "text-rose-500")} />
                            <p className="text-xs font-black uppercase tracking-widest text-text-primary">
                              Confirm {confirmAction}
                            </p>
                          </div>
                          
                          <p className="text-xs text-text-secondary font-bold">
                            Are you sure you want to {confirmAction} this {selectedItem.type} application? This action cannot be undone.
                          </p>

                          {confirmAction === 'reject' && (
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Reason for Rejection</label>
                              <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please provide a reason for rejection..."
                                className="w-full h-24 p-3 rounded-xl border border-border bg-surface text-xs text-text-primary focus:border-rose-500 focus:outline-none transition-all resize-none"
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setConfirmAction(null);
                                setRejectionReason('');
                              }}
                              className="flex-1 py-3 rounded-xl border border-border bg-surface text-xs font-black text-text-secondary hover:text-text-primary transition-all"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={confirmFinalAction}
                              disabled={confirmAction === 'reject' && !rejectionReason.trim()}
                              className={cn(
                                "flex-1 py-3 rounded-xl text-xs font-black text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                confirmAction === 'approve' ? "bg-primary shadow-primary/20" : "bg-rose-500 shadow-rose-500/20"
                              )}
                            >
                              Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col gap-3"
                        >
                          <button 
                            onClick={() => handleAction('approve')}
                            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="size-5" /> {selectedItem.type === 'student' ? 'Approve Student' : 'Approve Entity'}
                          </button>
                          <button 
                            onClick={() => handleAction('reject')}
                            className="w-full py-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 font-black text-sm hover:bg-rose-100 transition-all"
                          >
                            Reject Application
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 rounded-[2rem] border border-dashed border-border bg-surface/50 text-center gap-4">
                <div className="size-20 rounded-3xl bg-background flex items-center justify-center">
                  <ShieldCheck className="size-10 text-text-secondary opacity-20" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-black text-text-primary tracking-tight">No Selection</p>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Select an applicant from the queue to review details.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface rounded-[2.5rem] border border-border shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-border flex items-center justify-between bg-background/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="p-3 rounded-2xl bg-surface border border-border text-text-secondary hover:text-primary hover:border-primary transition-all group mr-2"
                  >
                    <ArrowLeft className="size-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <History className="size-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-black text-text-primary tracking-tight">Verification History</h3>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Audit log of all past verification actions</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-3 rounded-2xl hover:bg-background transition-colors"
                >
                  <X className="size-6 text-text-secondary" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="flex flex-col gap-6">
                  {/* History Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary size-4" />
                      <input 
                        type="text"
                        placeholder="Search history by entity name or admin..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full h-12 rounded-2xl border border-border bg-background pl-12 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={historyFilterAction}
                        onChange={(e) => setHistoryFilterAction(e.target.value as 'all' | 'approved' | 'rejected')}
                        className="h-12 px-4 rounded-2xl border border-border bg-background text-sm font-bold text-text-secondary focus:border-primary focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="all">All Actions</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <select
                        value={historyFilterType}
                        onChange={(e) => setHistoryFilterType(e.target.value as 'all' | 'student' | 'company')}
                        className="h-12 px-4 rounded-2xl border border-border bg-background text-sm font-bold text-text-secondary focus:border-primary focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="all">All Types</option>
                        <option value="student">Student</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="flex flex-col gap-4">
                    {historyItems
                      .filter(h => {
                        const matchesSearch = h.entity.toLowerCase().includes(historySearch.toLowerCase()) || 
                                              h.admin.toLowerCase().includes(historySearch.toLowerCase());
                        const matchesAction = historyFilterAction === 'all' || h.action === historyFilterAction;
                        const matchesType = historyFilterType === 'all' || h.type === historyFilterType;
                        return matchesSearch && matchesAction && matchesType;
                      }).length > 0 ? (
                      historyItems
                        .filter(h => {
                          const matchesSearch = h.entity.toLowerCase().includes(historySearch.toLowerCase()) || 
                                                h.admin.toLowerCase().includes(historySearch.toLowerCase());
                          const matchesAction = historyFilterAction === 'all' || h.action === historyFilterAction;
                          const matchesType = historyFilterType === 'all' || h.type === historyFilterType;
                          return matchesSearch && matchesAction && matchesType;
                        })
                        .map((log) => (
                          <div key={log.id} className="p-6 rounded-3xl border border-border bg-background/30 hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                                log.action === 'approved' ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" : "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20"
                              )}>
                                {log.action === 'approved' ? <CheckCircle2 className="size-7" /> : <AlertCircle className="size-7" />}
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black text-text-primary tracking-tight">{log.entity}</span>
                                  <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                    log.type === 'student' 
                                      ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" 
                                      : "bg-blue-500/5 text-blue-600 border-blue-500/20"
                                  )}>
                                    {log.type === 'student' ? <GraduationCap className="size-3" /> : <Building2 className="size-3" />}
                                    {log.type}
                                  </div>
                                </div>
                                <p className="text-sm text-text-secondary font-medium leading-relaxed max-w-md line-clamp-2">
                                  {log.notes}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-8 md:text-right shrink-0 border-t md:border-t-0 border-border pt-4 md:pt-0 mt-2 md:mt-0">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Verified By</span>
                                <span className="text-sm font-black text-text-primary tracking-tight flex items-center gap-1.5 md:justify-end">
                                  <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="size-3 text-primary" />
                                  </div>
                                  {log.admin}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Timestamp</span>
                                <div className="flex flex-col md:items-end">
                                  <span className="text-sm font-black text-text-primary tracking-tight">{log.date}</span>
                                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {log.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border-2 border-dashed border-border rounded-[2.5rem] bg-background/20">
                        <div className="size-20 rounded-3xl bg-background flex items-center justify-center shadow-sm">
                          <History className="size-10 text-text-secondary opacity-20" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-lg font-black text-text-primary tracking-tight">No History Found</p>
                          <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Try adjusting your search or filters.</p>
                        </div>
                        <button 
                          onClick={() => {
                            setHistorySearch('');
                            setHistoryFilterAction('all');
                            setHistoryFilterType('all');
                          }}
                          className="mt-2 text-xs font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border bg-background/30 flex justify-end">
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-8 py-3 rounded-2xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back to Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
