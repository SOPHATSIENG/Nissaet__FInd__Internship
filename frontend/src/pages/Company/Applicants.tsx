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
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Star
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../../components/company-components/ConfirmationModal';
import api from '../../api/axios';

export default function Applicants() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
  const [viewingApplicant, setViewingApplicant] = useState<any>(null);
  const selectAllRef = React.useRef<HTMLInputElement>(null);
  const itemsPerPage = 5;

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current user first
    const checkCurrentUser = async () => {
      try {
        const userResponse = await api.getCurrentUser();
        console.log('Current user:', userResponse);
        console.log('User role:', userResponse.user?.role);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    checkCurrentUser();
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      console.log('Fetching applicants...');
      const response = await api.getApplicants();
      console.log('Applicants response:', response);
      
      // Check if response has applications data
      if (!response || !response.applications) {
        console.log('No applications data in response:', response);
        setApplicants([]);
        return;
      }
      
      console.log('Raw applications data:', response.applications);
      
      // Transform database data to match frontend structure
      const transformedApplicants = (response.applications || []).map(app => ({
        ...app,
        name: app.full_name || app.name,
        role: app.internship_title || app.role || 'Unknown Role',
        date: app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : app.date,
        phone: app.phone || '+855 12 345 678',
        location: 'Phnom Penh, Cambodia', // Default location
        skills: ['JavaScript', 'React', 'Node.js'], // Default skills
        education: [
          { 
            school: app.university || 'University', 
            degree: app.major || 'Bachelor Degree', 
            period: '2020 - Present' 
          }
        ],
        experience: [
          { 
            company: 'Previous Company', 
            role: 'Previous Role', 
            period: '2022 - 2023' 
          }
        ],
        resumeUrl: app.resume_url || '#'
      }));
      
      console.log('Transformed applicants:', transformedApplicants);
      setApplicants(transformedApplicants);
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

  const handleDownload = (name: string) => {
    setModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Download CV',
      message: `The CV for ${name} is being downloaded. In a real application, this would fetch the PDF file from the server.`,
      confirmText: 'Got it',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
    });
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.updateApplicationStatus(id, newStatus);
      setApplicants(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Error updating application status:', error);
    }
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
        title: 'Reject Applicant',
        message: `Are you sure you want to reject ${name}? This action will move them to the rejected list.`,
        confirmText: 'Unshortlist',
        onConfirm: () => handleUpdateStatus(id, 'Unshortlist'),
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
        title: 'Bulk Reject',
        message: `Are you sure you want to reject ${selectedCount} selected applicants?`,
        confirmText: 'Reject All',
        onConfirm: () => {
          setApplicants(prev => prev.map(app => 
            selectedApplicants.includes(app.id) ? { ...app, status: 'Unshortlist' } : app
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
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.every(skill => app.skills.includes(skill));
    return matchesSearch && matchesRole && matchesStatus && matchesSkills;
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
  
  // Get unique skills for the filter dropdown
  const uniqueSkills = Array.from(new Set(applicants.flatMap(app => app.skills))).sort();

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
    setCurrentPage(1);
  };

  const activeFilterCount = [
    searchQuery !== '',
    roleFilter !== '',
    statusFilter !== '',
    selectedSkills.length > 0
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setSelectedSkills([]);
    setSelectedApplicants([]);
    setCurrentPage(1);
  };

  const stats = [
    { label: 'Total Applicants', value: applicants.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12 Today' },
    { label: 'Pending Review', value: applicants.filter(a => a.status === 'Pending Review' || a.status === 'pending').length.toString(), icon: Hourglass, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Shortlisted', value: applicants.filter(a => a.status === 'Shortlisted').length.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unshortlist', value: applicants.filter(a => a.status === 'Unshortlist').length.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
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
                  statusFilter === 'Rejected' ? 'bg-red-500' :
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
                        { label: 'Rejected', value: 'Rejected', color: 'bg-red-500' },
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

          <div className="relative min-w-[200px]">
            <button
              onClick={() => setIsSkillsDropdownOpen(!isSkillsDropdownOpen)}
              className={`w-full flex items-center justify-between pl-4 pr-3 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm border ${
                selectedSkills.length > 0 
                  ? 'bg-primary/5 border-primary text-primary' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star size={16} className={selectedSkills.length > 0 ? 'text-primary' : 'text-slate-400'} />
                {selectedSkills.length === 0 ? 'Filter by Skills' : `${selectedSkills.length} Skills Selected`}
              </div>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isSkillsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isSkillsDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsSkillsDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-30 overflow-hidden min-w-[240px]"
                  >
                    <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <div className="px-2 py-1.5 mb-1 border-b border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Skills</span>
                        {selectedSkills.length > 0 && (
                          <button 
                            onClick={() => setSelectedSkills([])}
                            className="text-[10px] font-bold text-red-500 hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      {uniqueSkills.map((skill: string) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSkills.includes(skill) 
                              ? 'bg-primary/10 text-primary font-bold' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selectedSkills.includes(skill) ? 'bg-primary border-primary text-background-dark' : 'border-slate-300 bg-white'
                          }`}>
                            {selectedSkills.includes(skill) && <Check size={12} strokeWidth={3} />}
                          </div>
                          {skill}
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
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all shadow-sm border ${
              isFilterOpen || activeFilterCount > 0
                ? 'bg-primary/5 border-primary text-primary'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={20} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-background-dark text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
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

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                  <span className="text-xs font-medium text-slate-500 py-1">Active Skill Filters:</span>
                  {selectedSkills.map(skill => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20"
                    >
                      {skill}
                      <button 
                        onClick={() => toggleSkill(skill)}
                        className="hover:text-primary-dark transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              className="absolute top-0 left-0 right-0 z-10 bg-primary/95 backdrop-blur-sm text-background-dark px-6 py-3 flex items-center justify-between shadow-lg"
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
                  onClick={() => handleBulkAction('reject')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
                  title="Reject selected"
                >
                  <XCircle size={16} />
                  Reject
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
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skills</th>
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
                          <img className="h-10 w-10 rounded-full object-cover" src={`https://picsum.photos/seed/applicant${app.id}/40/40`} alt={app.name} />
                          {app.is_available && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Available for Internship" />
                          )}
                        </div>
                        <div>
                          <button 
                            onClick={() => setViewingApplicant(app)}
                            className="font-semibold text-slate-900 text-sm hover:text-primary transition-colors text-left"
                          >
                            {app.name}
                          </button>
                          <p className="text-xs text-slate-500">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {app.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                            {skill}
                          </span>
                        ))}
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
                        app.status === 'Rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(app.name)}
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
                        {app.status === 'Rejected' ? (
                          <button 
                            onClick={() => openConfirmation(app.id, app.name, 'reconsider')}
                            className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" 
                            title="Reconsider"
                          >
                            <Undo2 size={20} />
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => openConfirmation(app.id, app.name, 'approve')}
                              className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" 
                              title="Approve"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button 
                              onClick={() => openConfirmation(app.id, app.name, 'reject')}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" 
                              title="Reject"
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
                      ? 'bg-primary text-background-dark border-primary' 
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
                      className="h-24 w-24 rounded-2xl object-cover shadow-md" 
                      src={`https://picsum.photos/seed/applicant${viewingApplicant.id}/200/200`} 
                      alt={viewingApplicant.name} 
                    />
                    {viewingApplicant.is_available && (
                      <div className="absolute -bottom-1 inset-x-0 mx-auto w-[90%] bg-emerald-500 text-white text-[8px] font-black py-0.5 px-1 rounded shadow-lg flex items-center justify-center gap-0.5 border border-white uppercase tracking-tighter">
                        <CheckCircle size={8} strokeWidth={3} />
                        <span>Available</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">{viewingApplicant.name}</h3>
                    <p className="text-slate-500 font-medium">{viewingApplicant.role}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                        viewingApplicant.status === 'Shortlisted' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        viewingApplicant.status === 'Rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                      }`}>
                        {viewingApplicant.status}
                      </span>
                      <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200">
                        Applied {viewingApplicant.date}
                      </span>
                      {viewingApplicant.is_available ? (
                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Available for Internship
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
                          Not Looking
                        </span>
                      )}
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
                      onClick={() => handleDownload(viewingApplicant.name)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background-dark rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                    >
                      <Download size={18} />
                      Download Resume
                    </button>
                    <Link 
                      to={`/company/student/${viewingApplicant.student_id}`}
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
