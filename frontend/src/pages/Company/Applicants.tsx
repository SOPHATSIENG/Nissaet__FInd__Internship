import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Users, 
  Hourglass, 
  CheckCircle, 
  XCircle, 
  X,
  Filter, 
  SortAsc,
  FileText,
  Eye,
  Undo2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Trash2,
  FileDown,
  Star,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../../components/company-components/ConfirmationModal';
import api from '../../api/axios';
import * as XLSX from 'xlsx';

export default function Applicants() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
  const [viewingApplicant, setViewingApplicant] = useState<any>(null);
  const selectAllRef = React.useRef<HTMLInputElement>(null);
  const itemsPerPage = 5;

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  const toBoolean = (value: any, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
      if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
  };

  const getAvatarUrl = (profileImage?: string, name?: string, size = 40) => {
    if (profileImage) return profileImage;
    const fallbackName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.comhttps://3.236.242.186.nip.io/api/?name=${fallbackName}&size=${size}&background=0D8ABC&color=fff`;
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return 'Pending Review';
    const value = status.toLowerCase();
    if (value === 'accepted') return 'Shortlisted';
    if (value === 'shortlisted') return 'Shortlisted';
    if (value === 'reviewing') return 'Pending Review';
    if (value === 'pending') return 'Pending Review';
    if (value === 'unshortlisted') return 'Unshortlisted';
    if (value === 'rejected') return 'Unshortlisted';
    if (value === 'withdrawn') return 'Withdrawn';
    return status;
  };

  const toApiStatus = (status: string) => {
    if (status === 'Shortlisted') return 'accepted';
    if (status === 'Pending Review') return 'pending';
    if (status === 'Unshortlisted') return 'unshortlisted';
    if (status === 'Rejected') return 'rejected';
    return status.toLowerCase();
  };

  useEffect(() => {
    // Check current user first
    const checkCurrentUser = async () => {
      try {
        const userResponse = await api.getCurrentUser();
        console.log('Current user:', userResponse);
        console.log('User role:', userResponse.user?.role);
        console.log('User ID:', userResponse.user?.id);
        
        // Check if user is company
        if (userResponse.user?.role !== 'company') {
          console.error('User is not a company user! Role:', userResponse.user?.role);
          showNotification('You must be logged in as a company user to view applicants.', 'error');
          return;
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        showNotification('Error: Please log in again.', 'error');
      }
    };
    
    checkCurrentUser();
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      console.log('Fetching applicants from database...');

      const response = await api.getCompanyApplications({ page: 1, limit: 200 });
      const applications = response?.applications || [];
      console.log('Company applications response:', response);

      const transformedApplicants = applications.map(app => {
        const skills = Array.isArray(app.skills)
          ? app.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean)
          : typeof app.skills === 'string'
            ? app.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
            : [];

        const education = [];
        if (app.university || app.major || app.current_education_level) {
          const degreeParts = [app.major, app.current_education_level].filter(Boolean);
          education.push({
            school: app.university || '',
            degree: degreeParts.join(' · '),
            period: ''
          });
        }

        const experience = Array.isArray(app.experience)
          ? app.experience
          : [];

        return {
          ...app,
          name: app.full_name || app.name || 'Unknown Applicant',
          role: app.internship_title || app.role || 'Unknown Role',
          date: app.applied_at
            ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : (app.date || ''),
          status: normalizeStatus(app.status),
          phone: app.phone || '',
          location: app.location || '',
          skills,
          education,
          experience,
          resumeUrl: app.resume_url || '',
          profileImage: app.profile_image || '',
          is_available: toBoolean(app.is_available, true)
        };
      });

      console.log('Transformed applicants:', transformedApplicants);
      console.log('About to set applicants with:', transformedApplicants.length, 'items');
      setApplicants(transformedApplicants);
      console.log('Applicants set successfully');
    } catch (error) {
      console.error('Error fetching applicants:', error);
      // Show more detailed error information
      if (error.message.includes('403')) {
        console.error('Authentication error - user may not be logged in as company');
      } else if (error.message.includes('404')) {
        console.error('Company not found');
      }
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectApplicant = (id: number) => {
    setSelectedApplicants(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'danger' | 'info';
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const handleDownload = (name: string, resumeUrl?: string) => {
    if (!resumeUrl) {
      setModalConfig({
        isOpen: true,
        type: 'info',
        title: 'Download CV',
        message: `No CV file was provided for ${name}.`,
        confirmText: 'Got it',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const apiOrigin = (() => {
      const raw = import.meta.env.VITE_API_BASE_URL || 'https://3.236.242.186.nip.io/api';
      try {
        return new URL(raw).origin;
      } catch {
        return '';
      }
    })();

    const fileBase = String(name || 'Applicant')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '');

    const triggerBlobDownload = (blob: Blob, filename: string) => {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    };

    const normalizeResumeUrl = (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return trimmed;

      if (apiOrigin) {
        if (trimmed.startsWith('/uploads/')) return `${apiOrigin}${trimmed}`;
        if (trimmed.startsWith('uploads/')) return `${apiOrigin}/${trimmed}`;
      }

      try {
        const parsed = new URL(trimmed);
        if (
          apiOrigin &&
          parsed.hostname === 'localhost' &&
          new URL(apiOrigin).hostname === 'localhost' &&
          parsed.pathname.startsWith('/uploads/')
        ) {
          return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // Ignore URL parse failure and keep as-is
      }

      return trimmed;
    };

    const getGoogleDriveDirectDownloadUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        const idFromQuery = parsed.searchParams.get('id');
        if (idFromQuery) {
          return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(idFromQuery)}`;
        }
        const match = parsed.pathname.match(/\/d\/([^/]+)/);
        if (match?.[1]) {
          return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(match[1])}`;
        }
        return null;
      } catch {
        return null;
      }
    };

    const downloadPdf = async () => {
      const resolvedUrl = normalizeResumeUrl(resumeUrl);
      const lowerUrl = resolvedUrl.toLowerCase();
      const isGoogleDrive = lowerUrl.includes('drive.google.com');
      if (isGoogleDrive) {
        const directUrl = getGoogleDriveDirectDownloadUrl(resolvedUrl);
        window.open(directUrl || resolvedUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      try {
        const token = localStorage.getItem('nissaet_auth_token');
        const response = await fetch(resolvedUrl, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          const reason =
            response.status === 404
              ? 'File not found (404).'
              : response.status === 401 || response.status === 403
                ? 'Access denied. Please log in again.'
                : `Download failed (${response.status}).`;

          setModalConfig({
            isOpen: true,
            type: 'info',
            title: 'Download CV',
            message: `Unable to download ${name}'s CV. ${reason}`,
            confirmText: 'Got it',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
          });
          return;
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const blob = await response.blob();

        const isPdfHeader = await blob
          .slice(0, 5)
          .text()
          .then((text) => text.startsWith('%PDF-'))
          .catch(() => false);

        if (!contentType.includes('application/pdf') && !isPdfHeader) {
          setModalConfig({
            isOpen: true,
            type: 'info',
            title: 'Download CV',
            message: `The CV link for ${name} did not return a valid PDF (it may be expired or broken).`,
            confirmText: 'Got it',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
          });
          return;
        }

        triggerBlobDownload(blob, `${fileBase || 'CV'}-CV.pdf`);
      } catch (error) {
        console.warn('PDF download failed:', error);
        setModalConfig({
          isOpen: true,
          type: 'info',
          title: 'Download CV',
          message: `Unable to download ${name}'s CV. Please try again, or ask the applicant to re-upload their CV.`,
          confirmText: 'Got it',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
        });
      }
    };

    void downloadPdf();
  };

  const handleExportList = () => {
    const rows = filteredApplicants.map(app => ({
      Name: app.name || '',
      Email: app.email || '',
      'Applied For': app.role || '',
      'Applied Date': app.date || '',
      Status: app.status || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants');

    const fileName = `applicants-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const previousApplicants = applicants;
    try {
      console.log(`[UPDATE] Updating application ${id} to status: ${newStatus}`);

      // Update UI immediately for better experience
      setApplicants(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));

      // Close modal
      setModalConfig(prev => ({ ...prev, isOpen: false }));

      // Convert status for database
      const apiStatus = toApiStatus(newStatus);

      // Save to database
      await api.updateApplicationStatus(id, apiStatus);
      console.log('[OK] Saved to database successfully');
      await fetchApplicants();
      showNotification(`Applicant status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('[ERROR] Error updating status:', error);
      setApplicants(previousApplicants);
      showNotification('Failed to update status in database. Please run migrations and check server logs.', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    // Create notification styles if not already added
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('[data-notification]');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.setAttribute('data-notification', 'true');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      ${type === 'success' ? 'background: #4caf50;' : ''}
      ${type === 'warning' ? 'background: #ff9800;' : ''}
      ${type === 'error' ? 'background: #f44336;' : ''}
      ${type === 'info' ? 'background: #2196f3; animation: slideIn 0.3s ease, pulse 1s infinite;' : ''}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after delay
    const dismissDelay = type === 'info' ? 10000 : 3000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, dismissDelay);
  };

  const updateDashboardStats = () => {
    // Force re-render of statistics
    setApplicants(prev => [...prev]);
    
    // Recalculate statistics
    const stats = applicants.reduce((acc, app) => {
      if (app.status === 'Pending Review') acc.pending++;
      else if (app.status === 'Shortlisted') acc.shortlisted++;
      else if (app.status === 'Unshortlisted') acc.unshortlisted++;
      return acc;
    }, { pending: 0, shortlisted: 0, unshortlisted: 0 });
    
    console.log('[STATS] Dynamic Dashboard Stats:', stats);
    
    // Update page title dynamically
    document.title = `Applicants (${applicants.length}) - Nissaet Internship`;
    
    return stats;
  };

  const openConfirmation = (id: number, name: string, action: 'approve' | 'Unshortlist' | 'reconsider') => {
    if (action === 'approve') {
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Approve Applicant',
        message: `Are you sure you want to shortlist ${name}? They will be notified of this decision.`,
        confirmText: 'Approve',
        onConfirm: () => handleUpdateStatus(id, 'Shortlisted'),
      });
    } else if (action === 'Unshortlist') {
      setModalConfig({
        isOpen: true,
        type: 'danger',
        title: 'Unshortlist Applicant',
        message: `Are you sure you want to Unshortlist ${name}? This action will move them to the Unshortlisted list.`,
        confirmText: 'Unshortlist',
        onConfirm: () => handleUpdateStatus(id, 'Unshortlisted'),
      });
    } else if (action === 'reconsider') {
      setModalConfig({
        isOpen: true,
        type: 'info',
        title: 'Reconsider Applicant',
        message: `Move ${name} back to pending review?`,
        confirmText: 'Reconsider',
        onConfirm: () => handleUpdateStatus(id, 'Pending Review'),
      });
    }
  };

  const handleBulkAction = (action: 'approve' | 'Unshortlist' | 'download' | 'reconsider' | 'delete') => {
    const selectedCount = selectedApplicants.length;
    if (selectedCount === 0) return;

    if (action === 'approve') {
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Bulk Approve',
        message: `Are you sure you want to shortlist ${selectedCount} selected applicants?`,
        confirmText: 'Approve All',
        onConfirm: () => {
          setApplicants(prev => prev.map(app => 
            selectedApplicants.includes(app.id) ? { ...app, status: 'Shortlisted' } : app
          ));
          setSelectedApplicants([]);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else if (action === 'Unshortlist') {
      setModalConfig({
        isOpen: true,
        type: 'danger',
        title: 'Bulk Unshortlist',
        message: `Are you sure you want to Unshortlist ${selectedCount} selected applicants?`,
        confirmText: 'Unshortlist All',
        onConfirm: () => {
          setApplicants(prev => prev.map(app => 
            selectedApplicants.includes(app.id) ? { ...app, status: 'Unshortlisted' } : app
          ));
          setSelectedApplicants([]);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else if (action === 'download') {
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Bulk Download',
        message: `Preparing CVs for ${selectedCount} applicants. They will be bundled into a ZIP file for download.`,
        confirmText: 'Download ZIP',
        onConfirm: () => {
          setSelectedApplicants([]);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else if (action === 'reconsider') {
      setModalConfig({
        isOpen: true,
        type: 'info',
        title: 'Bulk Reconsider',
        message: `Move ${selectedCount} selected applicants back to pending review?`,
        confirmText: 'Reconsider All',
        onConfirm: () => {
          setApplicants(prev => prev.map(app => 
            selectedApplicants.includes(app.id) ? { ...app, status: 'Pending Review' } : app
          ));
          setSelectedApplicants([]);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        },
      });
    } else if (action === 'delete') {
      setModalConfig({
        isOpen: true,
        type: 'danger',
        title: 'Bulk Delete',
        message: `Are you sure you want to delete ${selectedCount} selected applicants?`,
        confirmText: 'Delete All',
        onConfirm: () => {
          setApplicants(prev => prev.filter(app => !selectedApplicants.includes(app.id)));
          setSelectedApplicants([]);
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        },
      });
    }
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || app.role === roleFilter;
    const matchesStatus = statusFilter === '' || app.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApplicants = filteredApplicants.slice(startIndex, startIndex + itemsPerPage);

  const currentPageIds = currentApplicants.map(app => app.id);
  const selectedOnPage = currentPageIds.filter(id => selectedApplicants.includes(id));
  const isAllSelected = currentPageIds.length > 0 && selectedOnPage.length === currentPageIds.length;
  const isSomeSelected = selectedOnPage.length > 0 && selectedOnPage.length < currentPageIds.length;

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedApplicants(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedApplicants(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  // Get unique roles for the filter dropdown
  const uniqueRoles = Array.from(new Set(applicants.map(app => app.role)));
  
  const activeFilterCount = [
    searchQuery !== '',
    roleFilter !== '',
    statusFilter !== ''
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setSelectedApplicants([]);
    setCurrentPage(1);
  };

  const stats = [
    { label: 'Total Applicants', value: applicants.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12 Today' },
    { label: 'Pending Review', value: applicants.filter(a => a.status === 'Pending Review' || a.status === 'pending').length.toString(), icon: Hourglass, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Shortlisted', value: applicants.filter(a => a.status === 'Shortlisted').length.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unshortlisted', value: applicants.filter(a => a.status === 'Unshortlisted').length.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Applicants Management</h1>
          <p className="text-slate-500 mt-1">Review and manage student applications for your internship programs.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px]">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-full flex items-center justify-between pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  statusFilter === 'Shortlisted' ? 'bg-emerald-500' :
                  statusFilter === 'Unshortlisted' ? 'bg-red-500' :
                  statusFilter === 'Pending Review' ? 'bg-yellow-500' :
                  'bg-slate-300'
                }`} />
                {statusFilter || 'Filter by Status'}
              </div>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isStatusDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsStatusDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-30 overflow-hidden"
                  >
                    <div className="p-1">
                      {[
                        { label: 'All Statuses', value: '', color: 'bg-slate-300' },
                        { label: 'Pending Review', value: 'Pending Review', color: 'bg-yellow-500' },
                        { label: 'Shortlisted', value: 'Shortlisted', color: 'bg-emerald-500' },
                        { label: 'Unshortlisted', value: 'Unshortlisted', color: 'bg-red-500' },
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => {
                            setStatusFilter(option.value);
                            setIsStatusDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            statusFilter === option.value 
                              ? 'bg-primary/10 text-primary font-bold' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                          {statusFilter === option.value && <Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
              isFilterOpen
                ? 'bg-primary text-white border-primary'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={20} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            onClick={handleExportList}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Download size={20} />
            Export List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stat.trend}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Filter Options</h3>
                <button 
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input 
                      className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary w-full" 
                      placeholder="Name or email..." 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internship Role</label>
                  <select 
                    className="py-2 pl-3 pr-10 border border-slate-200 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary w-full cursor-pointer"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All Internships</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden relative">
        <AnimatePresence>
          {selectedApplicants.length > 0 && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-10 bg-primary/95 backdrop-blur-sm text-white px-6 py-3 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold">
                  {selectedApplicants.length} applicants selected
                </span>
                <button 
                  onClick={() => setSelectedApplicants([])}
                  className="text-xs font-medium hover:underline opacity-80"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
                  title="Shortlist selected"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button 
                  onClick={() => handleBulkAction('Unshortlist')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
                  title="Unshortlist selected"
                >
                  <XCircle size={16} />
                  Unshortlist
                </button>
                <button 
                  onClick={() => handleBulkAction('reconsider')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
                  title="Move to pending"
                >
                  <Undo2 size={16} />
                  Reset
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors"
                  title="Delete selected"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <div className="h-6 w-px bg-white/20 mx-1"></div>
                <button 
                  onClick={() => handleBulkAction('download')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary rounded-lg text-xs font-bold transition-colors"
                >
                  <FileDown size={16} />
                  Download CVs
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 w-10">
                  <div className="flex items-center">
                    <input 
                      ref={selectAllRef}
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicant Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied For</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentApplicants.length > 0 ? (
                currentApplicants.map((app) => (
                  <tr key={app.id} className={`group hover:bg-slate-50 transition-colors ${selectedApplicants.includes(app.id) ? 'bg-primary/5' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          checked={selectedApplicants.includes(app.id)}
                          onChange={() => toggleSelectApplicant(app.id)}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img className="h-10 w-10 rounded-full object-cover" src={getAvatarUrl(app.profileImage, app.name, 40)} alt={app.name} />
                          {app.is_available && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" aria-label="Available for internships" />
                          )}
                        </div>
                        <div>
                          <button 
                            onClick={() => setViewingApplicant(app)}
                            className="font-semibold text-slate-900 text-sm hover:text-primary transition-colors text-left"
                          >
                            {app.name}
                          </button>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500">{app.email}</p>
                            {app.is_available ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Open to work
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                Not available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-slate-700">{app.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{app.date}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        app.status === 'Shortlisted' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        app.status === 'Unshortlisted' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(app.name, app.resumeUrl)}
                          className="p-1.5 text-slate-400 hover:text-primary transition-colors" 
                          title="Download CV"
                        >
                          <Download size={20} />
                        </button>
                        <button 
                          onClick={() => setViewingApplicant(app)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" 
                          title="View Profile"
                        >
                          <Eye size={20} />
                        </button>
                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        {app.status === 'Unshortlisted' ? (
                          <button 
                            onClick={() => openConfirmation(app.id, app.name, 'reconsider')}
                            className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" 
                            title="Reconsider"
                          >
                            <Undo2 size={20} />
                          </button>
                        ) : (
                          <>
                            {app.status === 'Shortlisted' ? (
                              <div
                                className="p-1.5 text-emerald-500"
                                title="Approved"
                                aria-label="Approved"
                              >
                                <CheckCircle size={20} />
                              </div>
                            ) : (
                              <button 
                                onClick={() => openConfirmation(app.id, app.name, 'approve')}
                                className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" 
                                title="Approve"
                              >
                                <CheckCircle size={20} />
                              </button>
                            )}
                            <button 
                              onClick={() => openConfirmation(app.id, app.name, 'Unshortlist')}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" 
                              title="Unshortlist"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search size={40} strokeWidth={1.5} />
                      <p className="text-sm font-medium">No applicants found matching your filters.</p>
                      <button 
                        onClick={clearAllFilters}
                        className="text-primary text-sm font-semibold hover:underline mt-2"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{filteredApplicants.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-slate-900">{Math.min(startIndex + itemsPerPage, filteredApplicants.length)}</span> of <span className="font-medium text-slate-900">{filteredApplicants.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg border transition-all ${
                    currentPage === page 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
      />

      {/* Applicant Detail Drawer */}
      <AnimatePresence>
        {viewingApplicant && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingApplicant(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-slate-900">Applicant Details</h2>
                <button 
                  onClick={() => setViewingApplicant(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Header Info */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img 
                      className={`h-24 w-24 rounded-2xl object-cover shadow-md ${viewingApplicant.is_available ? 'ring-2 ring-emerald-400' : ''}`} 
                      src={getAvatarUrl(viewingApplicant.profileImage, viewingApplicant.name, 200)} 
                      alt={viewingApplicant.name} 
                    />
                    {viewingApplicant.is_available && (
                      <span
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm"
                        aria-label="Online"
                        title="Online"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">{viewingApplicant.name}</h3>
                    <p className="text-slate-500 font-medium">{viewingApplicant.role}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                        viewingApplicant.status === 'Shortlisted' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        viewingApplicant.status === 'Unshortlisted' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                      }`}>
                        {viewingApplicant.status}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                        viewingApplicant.is_available ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-600 ring-slate-200'
                      }`}>
                        {viewingApplicant.is_available ? 'Open to work' : 'Not available'}
                      </span>
                      <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200">
                        Applied {viewingApplicant.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="p-2 bg-white rounded-lg text-primary shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-slate-700">{viewingApplicant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="p-2 bg-white rounded-lg text-primary shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-medium text-slate-700">{viewingApplicant.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 md:col-span-2">
                    <div className="p-2 bg-white rounded-lg text-primary shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="text-sm font-medium text-slate-700">{viewingApplicant.location}</p>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={20} className="text-primary" />
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Education</h4>
                  </div>
                  <div className="space-y-4">
                    {viewingApplicant.education.map((edu: any, idx: number) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-slate-100">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                        <h5 className="font-bold text-slate-800 text-sm">{edu.school}</h5>
                        <p className="text-xs text-slate-600 mt-0.5">{edu.degree}</p>
                        <p className="text-[10px] font-bold text-primary mt-1">{edu.period}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={20} className="text-primary" />
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Work Experience</h4>
                  </div>
                  <div className="space-y-4">
                    {viewingApplicant.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-slate-100">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                        <h5 className="font-bold text-slate-800 text-sm">{exp.company}</h5>
                        <p className="text-xs text-slate-600 mt-0.5">{exp.role}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1">{exp.period}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star size={20} className="text-primary" />
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Skills & Expertise</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewingApplicant.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold border border-slate-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resume Link */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => handleDownload(viewingApplicant.name, viewingApplicant.resumeUrl)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                    >
                      <Download size={18} />
                      Download Resume
                    </button>
                    <Link 
                      to={`/company/student/${viewingApplicant.student_id || viewingApplicant.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink size={18} />
                      Full Profile Page
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}















