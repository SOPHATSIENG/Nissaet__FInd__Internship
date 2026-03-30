import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Settings2, 
  Send,
  ChevronDown,
  Shield,
  Clock,
  Mail,
  User,
  MoreVertical,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const admins = [
  { 
    name: 'Sophea Chan', 
    email: 'sophea.chan@example.com', 
    role: 'Super Admin', 
    status: 'Active', 
    active: 'Just now', 
    initial: 'SC', 
    color: 'from-primary/20 to-emerald-500/20', 
    textColor: 'text-primary',
    lastLogin: '2026-03-06 08:30 AM',
    permissions: ['Full Access', 'User Management', 'Financial Reports', 'System Settings']
  },
  { 
    name: 'Leakhena Samat', 
    email: 'leakhena.s@example.com', 
    role: 'Moderator', 
    status: 'Active', 
    active: '2 hours ago', 
    initial: 'LS', 
    color: 'from-blue-500/20 to-indigo-500/20', 
    textColor: 'text-blue-500',
    lastLogin: '2026-03-05 10:15 PM',
    permissions: ['User Verification', 'Content Moderation', 'Report Handling']
  },
  { 
    name: 'Rithy Phalla', 
    email: 'rithy.p@example.com', 
    role: 'Content Manager', 
    status: 'Inactive', 
    active: '3 days ago', 
    initial: 'RP', 
    color: 'from-orange-500/20 to-yellow-500/20', 
    textColor: 'text-orange-500',
    lastLogin: '2026-03-03 09:00 AM',
    permissions: ['Content Editing', 'Media Management']
  },
  { 
    name: 'Bopha Vatey', 
    email: 'bopha.v@example.com', 
    role: 'Moderator', 
    status: 'Active', 
    active: '5 hours ago', 
    initial: 'BV', 
    color: 'from-purple-500/20 to-pink-500/20', 
    textColor: 'text-purple-500',
    lastLogin: '2026-03-06 01:45 AM',
    permissions: ['User Verification', 'Content Moderation']
  },
];

const activities = [
  { 
    user: 'Sophea Chan', 
    action: 'approved 5 internship postings', 
    detail: 'Processed pending listings from Chip Mong Group.', 
    time: '10:45 AM Today', 
    icon: CheckCircle2,
    metadata: [
      { label: 'Company', value: 'Chip Mong Group' },
      { label: 'Postings', value: 'Software Engineer (2), Marketing Intern (3)' },
      { label: 'Verification', value: 'Business License Verified' }
    ]
  },
  { 
    user: 'Leakhena Samat', 
    action: 'updated system settings', 
    detail: 'Modified student verification workflow parameters.', 
    time: '03:20 PM Yesterday', 
    icon: Settings2,
    metadata: [
      { label: 'Setting', value: 'Verification Threshold' },
      { label: 'Old Value', value: '75%' },
      { label: 'New Value', value: '85%' },
      { label: 'Impact', value: 'Global Student Onboarding' }
    ]
  },
  { 
    user: 'Sophea Chan', 
    action: 'sent notification to ABC Company', 
    detail: 'Reminder sent regarding expired business permit documentation.', 
    time: '11:12 AM, Oct 26', 
    icon: Send,
    metadata: [
      { label: 'Recipient', value: 'hr@abc-company.com' },
      { label: 'Subject', value: 'Action Required: Document Expiry' },
      { label: 'Template', value: 'Compliance_Reminder_V2' }
    ]
  },
];

export const TeamManagement = () => {
  const [adminList, setAdminList] = useState(admins);
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

  // Add State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('Moderator');

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<any>(null);

  const toggleExpand = (email: string) => {
    setExpandedAdmin(expandedAdmin === email ? null : email);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newAdmin = {
      name: addName,
      email: addEmail,
      role: addRole,
      status: 'Active',
      active: 'Just now',
      initial: addName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      color: 'from-primary/20 to-emerald-500/20',
      textColor: 'text-primary',
      lastLogin: 'Never',
      permissions: addRole === 'Super Admin' 
        ? ['Full Access', 'User Management', 'Financial Reports', 'System Settings']
        : ['User Verification', 'Content Moderation']
    };
    setAdminList([...adminList, newAdmin]);
    setIsAddModalOpen(false);
    setAddName('');
    setAddEmail('');
    setAddRole('Moderator');
  };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditRole(admin.role);
    setEditStatus(admin.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminList(prev => prev.map(admin => 
      admin.email === editingAdmin.email 
        ? { ...admin, name: editName, email: editEmail, role: editRole, status: editStatus }
        : admin
    ));
    setIsEditModalOpen(false);
    setEditingAdmin(null);
  };

  const handleDelete = (admin: any) => {
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (adminToDelete) {
      setAdminList(prev => prev.filter(admin => admin.email !== adminToDelete.email));
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
      setExpandedAdmin(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-text-primary-light tracking-tight">Manage Admin Team</h1>
          <p className="text-text-secondary-light text-base">Overview of all system administrators and their access levels.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all"
        >
          <Plus className="size-4" /> Add Team Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-light p-4 rounded-xl border border-border-light shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light size-5" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-background-light/50 border border-border-light rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
            placeholder="Search by name or email..." 
            type="text"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select className="flex-1 md:w-40 px-3 py-2 bg-background-light/50 border border-border-light rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none">
            <option>All Roles</option>
            <option>Super Admin</option>
            <option>Moderator</option>
          </select>
          <select className="flex-1 md:w-40 px-3 py-2 bg-background-light/50 border border-border-light rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-light rounded-xl border border-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background-light/50 border-b border-border-light">
                <th className="px-6 py-4 text-xs font-bold text-text-secondary-light uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary-light uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary-light uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary-light uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary-light uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {adminList.map((admin) => (
                <React.Fragment key={admin.email}>
                  <tr 
                    onClick={() => toggleExpand(admin.email)}
                    className={cn(
                      "hover:bg-background-light/20 transition-all cursor-pointer",
                      expandedAdmin === admin.email && "bg-primary/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("size-10 rounded-full bg-gradient-to-tr flex items-center justify-center font-bold", admin.color, admin.textColor)}>
                          {admin.initial}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-primary-light">{admin.name}</span>
                          <span className="text-xs text-text-secondary-light">{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-[10px] font-bold uppercase rounded-full",
                        admin.role === 'Super Admin' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("size-2 rounded-full", admin.status === 'Active' ? "bg-primary" : "bg-gray-400")}></div>
                        <span className="text-sm text-text-primary-light">{admin.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light">{admin.active}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ChevronDown className={cn("size-4 text-text-secondary-light transition-transform", expandedAdmin === admin.email && "rotate-180")} />
                      </div>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedAdmin === admin.email && (
                      <tr>
                        <td colSpan={5} className="px-6 py-0 bg-background-light/10">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="py-6 flex flex-col gap-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-light border border-border-light shadow-sm">
                                  <div className="flex items-center gap-2 text-text-secondary-light">
                                    <Clock className="size-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Last Login</span>
                                  </div>
                                  <span className="text-sm font-bold text-text-primary-light">{admin.lastLogin}</span>
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-3 p-4 rounded-xl bg-surface-light border border-border-light shadow-sm">
                                  <div className="flex items-center gap-2 text-text-secondary-light">
                                    <Shield className="size-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Active Permissions</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {admin.permissions.map((perm) => (
                                      <span key={perm} className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
                                        {perm}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-border-light">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-xs text-text-secondary-light">
                                    <Mail className="size-3.5" />
                                    <span>Contact: {admin.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-text-secondary-light">
                                    <User className="size-3.5" />
                                    <span>ID: ADM-{admin.initial}-{admin.email.length}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => handleEdit(admin)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-light bg-surface-light hover:bg-background-light transition-all text-xs font-bold text-text-primary-light"
                                  >
                                    <Edit2 className="size-3.5" /> Edit Member
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(admin)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-all text-xs font-bold text-red-600"
                                  >
                                    <Trash2 className="size-3.5" /> Remove Access
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border-light flex items-center justify-between">
          <p className="text-xs text-text-secondary-light font-medium">Showing {adminList.length} of 12 admins</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-bold rounded-lg border border-border-light text-text-secondary-light hover:bg-background-light">Previous</button>
            <button className="px-3 py-1 text-xs font-bold rounded-lg border border-border-light text-text-primary-light hover:bg-background-light">Next</button>
          </div>
        </div>
      </div>

      <section className="bg-surface-light rounded-xl border border-border-light shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-border-light flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-text-primary-light">Admin Activity Log</h3>
            <p className="text-sm text-text-secondary-light">Chronological overview of team actions.</p>
          </div>
          <button className="text-xs font-bold text-primary hover:underline">View All Log</button>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-6">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-background-light/50 border border-border-light/50 hover:border-primary/30 transition-all group">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-surface-dark transition-colors">
                  <activity.icon className="size-5" />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-text-primary-light">
                      <span className="text-primary">{activity.user}</span> {activity.action}
                    </p>
                    <span className="text-[10px] text-text-secondary-light font-black uppercase tracking-widest">{activity.time}</span>
                  </div>
                  <p className="text-xs text-text-secondary-light mt-1">{activity.detail}</p>
                  
                  {/* Detailed Metadata Section */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activity.metadata.map((meta, mIdx) => (
                      <div key={mIdx} className="flex flex-col gap-1 p-3 rounded-lg bg-surface-light border border-border-light/50 shadow-sm">
                        <span className="text-[10px] font-black text-text-secondary-light uppercase tracking-tighter">{meta.label}</span>
                        <span className="text-xs font-bold text-text-primary-light truncate">{meta.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
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
                  <h2 className="text-xl font-bold text-text-primary-light">Add Team Member</h2>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-text-secondary-light hover:text-text-primary-light hover:bg-background-light rounded-lg transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Full Name</label>
                    <input 
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Sokha Chan"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Email Address</label>
                    <input 
                      type="email"
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="e.g. sokha.chan@example.com"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Role</label>
                    <select 
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Content Manager">Content Manager</option>
                    </select>
                    <p className="text-xs text-text-secondary-light mt-1">
                      {addRole === 'Super Admin' ? 'Full access to all system features and settings.' :
                       addRole === 'Moderator' ? 'Can verify users and moderate content.' :
                       'Can manage content and media only.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-surface-dark text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-primary/20"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Admin Modal */}
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
                  <h2 className="text-xl font-bold text-text-primary-light">Edit Team Member</h2>
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
                      disabled
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
                        <option value="Super Admin">Super Admin</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Content Manager">Content Manager</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-primary-light">Status</label>
                      <select 
                        className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
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
                  <h2 className="text-xl font-bold text-text-primary-light">Remove Access</h2>
                  <p className="text-sm text-text-secondary-light">
                    Are you sure you want to remove access for <span className="font-bold text-text-primary-light">{adminToDelete?.name}</span>? 
                    They will no longer be able to access the administrative dashboard.
                  </p>
                </div>
                
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
                    Remove Member
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
