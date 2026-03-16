import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MoreVertical, Edit2, ShieldAlert, CheckCircle, Eye, Check, X, ChevronDown, Activity, ArrowUpDown, ArrowUp, ArrowDown, Shield, Lock, Unlock, Save, Calendar, Clock, Trash2, ShieldCheck, ShieldX, User, Building2, UserCheck, UserX, Fingerprint, Key, Download, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';

const ROLES = ['Student', 'Company', 'Admin'];
const STATUSES = ['Active', 'Pending', 'Suspended'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
];

interface RolePermission {
  id: string;
  label: string;
  description: string;
  category: 'General' | 'User Management' | 'Content' | 'System';
}

const PERMISSIONS: RolePermission[] = [
  { id: 'view_dashboard', label: 'View Dashboard', description: 'Access to the main analytics dashboard', category: 'General' },
  { id: 'edit_profile', label: 'Edit Own Profile', description: 'Ability to update personal information', category: 'General' },
  { id: 'manage_users', label: 'Manage Users', description: 'Create, edit, and suspend user accounts', category: 'User Management' },
  { id: 'verify_users', label: 'Verify Certificates', description: 'Approve or reject student verification requests', category: 'User Management' },
  { id: 'manage_categories', label: 'Manage Categories', description: 'Create and edit skill/industry categories', category: 'Content' },
  { id: 'post_jobs', label: 'Post Jobs', description: 'Create and manage job listings (Company only)', category: 'Content' },
  { id: 'view_analytics', label: 'View Detailed Analytics', description: 'Access to deep-dive system reports', category: 'System' },
  { id: 'system_settings', label: 'Manage System Settings', description: 'Configure platform-wide parameters', category: 'System' },
];

const INITIAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Admin': PERMISSIONS.map(p => p.id),
  'Company': ['view_dashboard', 'edit_profile', 'post_jobs'],
  'Student': ['view_dashboard', 'edit_profile'],
};

export const UserManagement = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [rolePermissions, setRolePermissions] = useState(INITIAL_ROLE_PERMISSIONS);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState('All Users');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Create User State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState('Student');
  const [createStatus, setCreateStatus] = useState('Active');

  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const data = await api.adminGetAllUsers();
        // Capitalize role for display compatibility
        const normalized = data.map((u: any) => ({
          ...u,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          registrationDate: u.date,
          lastLogin: 'Active session'
        }));
        setUserList(normalized);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: (userList.length + 1).toString(),
      name: createName,
      email: createEmail,
      role: createRole,
      status: createStatus,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      initial: createName.charAt(0).toUpperCase(),
      color: 'bg-emerald-100',
      lastLogin: 'Never',
      registrationDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };
    setUserList([newUser, ...userList]);
    setIsCreateModalOpen(false);
    setCreateName('');
    setCreateEmail('');
    setCreateRole('Student');
    setCreateStatus('Active');
  };

  const handleDelete = (user: any) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUserList(prev => prev.filter(user => user.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSuspend = (id: string) => {
    setUserList(prev => prev.map(user => 
      user.id === id ? { ...user, status: 'Suspended' } : user
    ));
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditStatus(user.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserList(prev => prev.map(user => 
      user.id === editingUser.id 
        ? { ...user, name: editName, email: editEmail, role: editRole, status: editStatus }
        : user
    ));
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const togglePermission = (role: string, permissionId: string) => {
    setRolePermissions(prev => {
      const current = prev[role] || [];
      const updated = current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId];
      return { ...prev, [role]: updated };
    });
  };

  const handleSavePermissions = () => {
    setIsSavingPermissions(true);
    setTimeout(() => {
      setIsSavingPermissions(false);
    }, 1500);
  };

  const handleResetPermissions = () => {
    if (window.confirm('Are you sure you want to reset all permissions to their default values?')) {
      setRolePermissions(INITIAL_ROLE_PERMISSIONS);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
    setCurrentPage(1);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'All Users') setSelectedRoles([]);
    else if (tab === 'Students') setSelectedRoles(['Student']);
    else if (tab === 'Companies') setSelectedRoles(['Company']);
    else if (tab === 'Admins') setSelectedRoles(['Admin']);
    setCurrentPage(1);
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = userList.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(user.status);

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0;
    });

    return result;
  }, [searchQuery, selectedRoles, selectedStatuses, sortBy]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  const clearFilters = () => {
    setSelectedRoles([]);
    setSelectedStatuses([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Registration Date', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedUsers.map(user => [
        user.id,
        `"${user.name}"`,
        `"${user.email}"`,
        user.role,
        user.status,
        user.registrationDate,
        user.lastLogin
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'users_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-text-primary-light tracking-tight">All Users</h1>
          <p className="text-text-secondary-light text-base">Manage student and company accounts, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-gray-200 border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-300 hover:text-gray-800 transition-colors shadow-sm"
          >
            <Download className="size-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="text-lg">+</span> Create User
          </button>
        </div>
      </div>

      <div className="border-b border-border-light">
        <nav className="-mb-px flex space-x-8">
          {['All Users', 'Students', 'Companies', 'Admins', 'Permissions'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors relative",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-text-secondary-light hover:text-text-primary-light"
              )}
            >
              <div className="flex items-center gap-2">
                {tab === 'Permissions' && <Shield className="size-4" />}
                {tab}
              </div>
              {/* {tab !== 'All Users' && tab !== 'Permissions' && (
                <span className="ml-2 rounded-full bg-background-light border border-border-light px-2.5 py-0.5 text-xs font-medium text-text-primary-light">
                  {tab === 'Students' ? '12,450' : tab === 'Companies' ? '850' : '12'}
                </span>
              )} */}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Permissions' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex justify-between items-center bg-surface-light p-6 rounded-xl border border-border-light shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-text-primary-light">Role-Based Access Control</h2>
              <p className="text-sm text-text-secondary-light text-balance max-w-2xl">
                Define the permissions for each user role. Changes applied here will affect all users with the respective role immediately.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleResetPermissions}
                className="text-sm font-bold text-red-500 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
              >
                Reset to Defaults
              </button>
              <button 
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
                className="flex items-center gap-2 bg-primary text-surface-dark px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingPermissions ? (
                  <>
                    <Activity className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ROLES.map(role => (
              <div key={role} className="flex flex-col rounded-xl border border-border-light bg-surface-light shadow-sm overflow-hidden">
                <div className="p-4 bg-background-light border-b border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center",
                      role === 'Admin' ? "bg-slate-900 text-white" :
                      role === 'Company' ? "bg-primary text-surface-dark" :
                      "bg-blue-600 text-white"
                    )}>
                      {role === 'Admin' ? <Shield className="size-4" /> : 
                       role === 'Company' ? <Activity className="size-4" /> : 
                       <Eye className="size-4" />}
                    </div>
                    <h3 className="font-bold text-text-primary-light">{role} Role</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary-light bg-white px-2 py-1 rounded border border-border-light">
                    {rolePermissions[role]?.length || 0} Permissions
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  {['General', 'User Management', 'Content', 'System'].map(category => {
                    const categoryPermissions = PERMISSIONS.filter(p => p.category === category);
                    if (categoryPermissions.length === 0) return null;
                    
                    return (
                      <div key={category} className="flex flex-col gap-2">
                        <p className="text-[10px] font-black text-text-secondary-light uppercase tracking-tighter">{category}</p>
                        <div className="flex flex-col gap-1">
                          {categoryPermissions.map(permission => (
                            <button
                              key={permission.id}
                              onClick={() => togglePermission(role, permission.id)}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg border transition-all text-left group",
                                rolePermissions[role]?.includes(permission.id)
                                  ? "bg-primary/5 border-primary/20 text-text-primary-light"
                                  : "bg-transparent border-transparent text-text-secondary-light hover:bg-background-light"
                              )}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className={cn("text-xs font-bold", rolePermissions[role]?.includes(permission.id) && "text-primary")}>
                                  {permission.label}
                                </span>
                                <span className="text-[10px] opacity-70 leading-tight">{permission.description}</span>
                              </div>
                              <div className={cn(
                                "size-5 rounded border flex items-center justify-center transition-all",
                                rolePermissions[role]?.includes(permission.id)
                                  ? "bg-primary border-primary text-surface-dark"
                                  : "bg-white border-border-light group-hover:border-primary/50"
                              )}>
                                {rolePermissions[role]?.includes(permission.id) ? <Check className="size-3 stroke-[3]" /> : <Lock className="size-2.5 opacity-20" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col rounded-xl border border-border-light bg-surface-light shadow-sm">
        <div className="flex flex-col gap-4 p-4 border-b border-border-light">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light size-4" />
              <input 
                className="h-10 w-full rounded-lg border border-border-light bg-background-light pl-10 pr-4 text-sm text-text-primary-light placeholder-text-secondary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="Search users..." 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto relative">
              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-lg border transition-all text-sm font-bold",
                    sortBy !== 'date-desc' 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border-light bg-background-light text-text-secondary-light hover:border-primary/50"
                  )}
                >
                  <ArrowUpDown className="size-4" />
                  Sort
                  <ChevronDown className={cn("size-4 transition-transform", isSortOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isSortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-surface-light border border-border-light rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1"
                      >
                        {SORT_OPTIONS.map(option => (
                          <button 
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setIsSortOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg text-sm transition-colors",
                              sortBy === option.value ? "bg-primary/10 text-primary font-bold" : "text-text-secondary-light hover:bg-background-light"
                            )}
                          >
                            {option.label}
                            {sortBy === option.value && <Check className="size-4" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-lg border transition-all text-sm font-bold",
                    selectedStatuses.length > 0
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border-light bg-background-light text-text-secondary-light hover:border-primary/50"
                  )}
                >
                  <Activity className="size-4" />
                  Status
                  {selectedStatuses.length > 0 && (
                    <span className="flex items-center justify-center size-5 rounded-full bg-primary text-surface-dark text-[10px]">
                      {selectedStatuses.length}
                    </span>
                  )}
                  <ChevronDown className={cn("size-4 transition-transform", isStatusOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isStatusOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-surface-light border border-border-light rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1"
                      >
                        {STATUSES.map(status => (
                          <button 
                            key={status}
                            onClick={() => {
                              toggleStatus(status);
                            }}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg text-sm transition-colors",
                              selectedStatuses.includes(status) ? "bg-primary/10 text-primary font-bold" : "text-text-secondary-light hover:bg-background-light"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn("size-1.5 rounded-full", 
                                status === 'Active' ? "bg-emerald-500" :
                                status === 'Pending' ? "bg-amber-500" :
                                "bg-red-500"
                              )}></div>
                              {status}
                            </div>
                            {selectedStatuses.includes(status) && <Check className="size-4" />}
                          </button>
                        ))}
                        {selectedStatuses.length > 0 && (
                          <button 
                            onClick={() => setSelectedStatuses([])}
                            className="mt-1 p-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors text-center"
                          >
                            Reset Status
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-lg border transition-all text-sm font-bold",
                  isFilterOpen || selectedRoles.length > 0 || selectedStatuses.length > 0
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border-light bg-background-light text-text-secondary-light hover:border-primary/50"
                )}
              >
                <Filter className="size-4" />
                Filters
                {(selectedRoles.length > 0 || selectedStatuses.length > 0) && (
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary text-surface-dark text-[10px]">
                    {selectedRoles.length + selectedStatuses.length}
                  </span>
                )}
                <ChevronDown className={cn("size-4 transition-transform", isFilterOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsFilterOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-72 bg-surface-light border border-border-light rounded-xl shadow-xl z-20 p-4 flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-3">
                        <p className="text-xs font-black text-text-secondary-light uppercase tracking-widest">Quick Filters</p>
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => {
                              setSelectedStatuses(['Active']);
                              setIsFilterOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-background-light transition-colors text-sm text-text-secondary-light group"
                          >
                            <span className="group-hover:text-primary transition-colors">Active Users Only</span>
                            <CheckCircle className="size-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-border-light" />

                      <div className="flex flex-col gap-3">
                        <p className="text-xs font-black text-text-secondary-light uppercase tracking-widest">Roles</p>
                        <div className="flex flex-col gap-1">
                          {ROLES.map(role => (
                            <button 
                              key={role}
                              onClick={() => toggleRole(role)}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-background-light transition-colors text-sm"
                            >
                              <span className={cn(selectedRoles.includes(role) ? "text-primary font-bold" : "text-text-secondary-light")}>
                                {role}
                              </span>
                              {selectedRoles.includes(role) && <Check className="size-4 text-primary" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-border-light" />

                      <div className="flex flex-col gap-3">
                        <p className="text-xs font-black text-text-secondary-light uppercase tracking-widest">Statuses</p>
                        <div className="flex flex-col gap-1">
                          {STATUSES.map(status => (
                            <button 
                              key={status}
                              onClick={() => toggleStatus(status)}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-background-light transition-colors text-sm"
                            >
                              <span className={cn(selectedStatuses.includes(status) ? "text-primary font-bold" : "text-text-secondary-light")}>
                                {status}
                              </span>
                              {selectedStatuses.includes(status) && <Check className="size-4 text-primary" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(selectedRoles.length > 0 || selectedStatuses.length > 0) && (
                        <div className="pt-2 border-t border-border-light">
                          <button 
                            onClick={clearFilters}
                            className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {(selectedRoles.length > 0 || selectedStatuses.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedRoles.map(role => (
                <span key={role} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  {role}
                  <button onClick={() => toggleRole(role)}><X className="size-3" /></button>
                </span>
              ))}
              {selectedStatuses.map(status => (
                <span key={status} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {status}
                  <button onClick={() => toggleStatus(status)}><X className="size-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-light text-xs uppercase text-text-secondary-light border-b border-border-light">
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:text-text-primary-light transition-colors"
                  onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                >
                  <div className="flex items-center gap-2">
                    User
                    {sortBy.startsWith('name') ? (
                      sortBy === 'name-asc' ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:text-text-primary-light transition-colors"
                  onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                >
                  <div className="flex items-center gap-2">
                    Registration Date
                    {sortBy.startsWith('date') ? (
                      sortBy === 'date-desc' ? <ArrowDown className="size-3 text-primary" /> : <ArrowUp className="size-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-sm">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr 
                      onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      className={cn(
                        "hover:bg-background-light/50 transition-colors group cursor-pointer",
                        expandedUserId === user.id && "bg-background-light"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={cn("size-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm", user.color, "border-black/5")}>
                              {user.initial}
                            </div>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 size-5 rounded-lg border-2 border-surface-light flex items-center justify-center shadow-sm",
                              user.status === 'Active' ? "bg-emerald-500 text-white" :
                              user.status === 'Pending' ? "bg-amber-500 text-white" :
                              "bg-red-500 text-white"
                            )}>
                              {user.status === 'Active' ? <ShieldCheck className="size-3" /> : 
                               user.status === 'Pending' ? <Fingerprint className="size-3" /> : 
                               <ShieldX className="size-3" />}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-text-primary-light">{user.name}</p>
                              {user.role === 'Admin' && <Shield className="size-3 text-slate-900" />}
                            </div>
                            <p className="text-xs text-text-secondary-light flex items-center gap-1">
                              <Lock className="size-2.5 opacity-40" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm transition-all",
                          user.role === 'Student' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          user.role === 'Company' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-slate-900 text-white border-slate-800"
                        )}>
                          {user.role === 'Student' ? <User className="size-3" /> : 
                           user.role === 'Company' ? <Building2 className="size-3" /> : 
                           <Key className="size-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm",
                          user.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          user.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {user.status === 'Active' ? <UserCheck className="size-3" /> : 
                           user.status === 'Pending' ? <Activity className="size-3" /> : 
                           <UserX className="size-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary-light">
                        {user.date}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.role === 'Student' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/admin/student-profile');
                              }}
                              className="p-1.5 text-text-secondary-light hover:text-primary transition-colors"
                            >
                              <Eye className="size-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(user);
                            }}
                            className="p-1.5 text-text-secondary-light hover:text-primary transition-colors"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(user);
                            }}
                            className="p-1.5 text-text-secondary-light hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                          {user.status !== 'Suspended' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSuspend(user.id);
                              }}
                              className="p-1.5 text-text-secondary-light hover:text-amber-500 transition-colors"
                              title="Suspend User"
                            >
                              <ShieldAlert className="size-4" />
                            </button>
                          )}
                          <ChevronDown className={cn("size-4 text-text-secondary-light transition-transform ml-2", expandedUserId === user.id && "rotate-180")} />
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedUserId === user.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-none">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden bg-background-light/30"
                            >
                              <div className="px-12 py-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-border-light/50">
                                <div className="flex flex-col gap-2">
                                  <p className="text-[10px] font-black text-text-secondary-light uppercase tracking-widest">Registration Date</p>
                                  <div className="flex items-center gap-2 text-text-primary-light">
                                    <Calendar className="size-4 text-primary" />
                                    <span className="text-sm font-bold">{user.registrationDate}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <p className="text-[10px] font-black text-text-secondary-light uppercase tracking-widest">Last Login</p>
                                  <div className="flex items-center gap-2 text-text-primary-light">
                                    <Clock className="size-4 text-primary" />
                                    <span className="text-sm font-bold">{user.lastLogin}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <p className="text-[10px] font-black text-text-secondary-light uppercase tracking-widest">Assigned Role</p>
                                  <div className="flex items-center gap-2 text-text-primary-light">
                                    <Shield className="size-4 text-primary" />
                                    <span className="text-sm font-bold">{user.role}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary-light italic">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border-light gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-secondary-light">
              Showing <span className="font-bold text-text-primary-light">
                {filteredAndSortedUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)}
              </span> of <span className="font-bold text-text-primary-light">{filteredAndSortedUsers.length}</span> users
            </p>
            <div className="h-4 w-px bg-border-light hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary-light">Rows per page:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-background-light border border-border-light rounded px-1.5 py-0.5 text-xs font-bold text-text-primary-light focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border-light text-text-secondary-light hover:bg-background-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, and pages around current page
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "size-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all",
                        currentPage === page 
                          ? "bg-primary text-surface-dark shadow-sm" 
                          : "text-text-secondary-light hover:bg-background-light"
                      )}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === 2 && currentPage > 3) || 
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <span key={page} className="text-text-secondary-light px-1">...</span>;
                }
                return null;
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border-light text-text-secondary-light hover:bg-background-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface-light rounded-2xl border border-border-light shadow-2xl overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="size-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                  <Trash2 className="size-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-text-primary-light">Confirm Deletion</h2>
                  <p className="text-sm text-text-secondary-light">
                    Are you sure you want to permanently delete <span className="font-bold text-text-primary-light">{userToDelete?.name}</span>? 
                    This action will remove all associated data and cannot be undone.
                  </p>
                </div>
                
                {userToDelete?.status === 'Suspended' && (
                  <div className="w-full p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-3 text-left">
                    <ShieldAlert className="size-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      Note: This user is currently <span className="font-bold">Suspended</span>. Deleting them will permanently erase their record.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 w-full mt-4">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-light rounded-2xl border border-border-light shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-light flex items-center justify-between bg-background-light/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Plus className="size-5" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary-light">Create New User</h2>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-text-secondary-light hover:text-text-primary-light hover:bg-background-light rounded-lg transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Full Name</label>
                    <input 
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Email Address</label>
                    <input 
                      type="email"
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="e.g. john.doe@example.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-primary-light">Role</label>
                      <select 
                        className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={createRole}
                        onChange={(e) => setCreateRole(e.target.value)}
                      >
                        <option value="Student">Student</option>
                        <option value="Company">Company</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-primary-light">Status</label>
                      <select 
                        className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={createStatus}
                        onChange={(e) => setCreateStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-surface-dark text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-primary/20"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-light rounded-2xl border border-border-light shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-light flex items-center justify-between bg-background-light/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Edit2 className="size-5" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary-light">Edit {editingUser?.role}</h2>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-text-secondary-light hover:text-text-primary-light hover:bg-background-light rounded-lg transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Full Name</label>
                    <input 
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Email Address</label>
                    <input 
                      type="email"
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-primary-light">Role</label>
                      <select 
                        className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-primary-light">Status</label>
                      <select 
                        className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Save Changes
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
