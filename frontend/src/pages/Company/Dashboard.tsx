import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  FilePlus, 
  Users, 
  CheckCircle, 
  History, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [stats, setStats] = useState([
    { label: 'Total Posted', value: '0', icon: FilePlus, color: 'text-blue-600', bg: 'bg-blue-50', trend: '0%', filter: 'all' },
    { label: 'Total Applicants', value: '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '0%', filter: 'applicants' },
    { label: 'Active Posts', value: '0', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Stable', filter: 'active' },
    { label: 'Expired Posts', value: '0', icon: History, color: 'text-orange-600', bg: 'bg-orange-50', trend: '0%', filter: 'expired' },
  ]);
  const [trends, setTrends] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentages from dashboard data
  const totalApps = dashboardData?.totalApplicants || 0;
  const statusDist = dashboardData?.statusDistribution || { pending: 0, shortlisted: 0, rejected: 0 };
  const pendingApps = statusDist.pending || 0;
  const shortlistedApps = statusDist.shortlisted || 0;
  const rejectedApps = statusDist.rejected || 0;

  const pendingPercent = totalApps > 0 ? Math.round((pendingApps / totalApps) * 100) : 0;
  const shortlistedPercent = totalApps > 0 ? Math.round((shortlistedApps / totalApps) * 100) : 0;
  const rejectedPercent = totalApps > 0 ? Math.round((rejectedApps / totalApps) * 100) : 0;

  const filteredInternships = React.useMemo(() => {
    if (activeFilter === 'all') return internships;
    if (activeFilter === 'active') return internships.filter((i: any) => i.status === 'active');
    if (activeFilter === 'expired') return internships.filter((i: any) => i.status !== 'active');
    return internships;
  }, [internships, activeFilter]);

  const handleCardClick = (filter: string) => {
    if (filter === 'applicants') {
      navigate('/company/applicants');
    } else {
      setActiveFilter(filter);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [internshipsResponse, statsResponse, trendsResponse] = await Promise.all([
        api.getCompanyInternships(),
        api.getDashboardStats(),
        api.getApplicationTrends()
      ]);
      
      setInternships(internshipsResponse.internships || []);
      setDashboardData(statsResponse);
      
      if (statsResponse) {
        setStats([
          { 
            label: 'Total Posted', 
            value: statsResponse.totalPosted?.toString() || '0', 
            icon: FilePlus, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50', 
            trend: statsResponse.postsTrend || 'Stable',
            filter: 'all'
          },
          { 
            label: 'Total Applicants', 
            value: statsResponse.totalApplicants?.toString() || '0', 
            icon: Users, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50', 
            trend: 'Direct Link',
            filter: 'applicants'
          },
          { 
            label: 'Active Posts', 
            value: statsResponse.activePosts?.toString() || '0', 
            icon: CheckCircle, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50', 
            trend: 'Active',
            filter: 'active'
          },
          { 
            label: 'Expired Posts', 
            value: statsResponse.expiredPosts?.toString() || '0', 
            icon: History, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50', 
            trend: 'Inactive',
            filter: 'expired'
          }
        ]);
      }
      
      setTrends(trendsResponse.trends || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteInternship(deleteId);
      setInternships(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete internship:', err);
      alert('Failed to delete internship. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDropdown = (jobId) => {
    setActiveDropdown(activeDropdown === jobId ? null : jobId);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {(user?.company_profile?.company_name || user?.company_name || 'Company')} Team. Here's what's happening today.
          </p>
        </div>
        <Link 
          to="/company/post"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all"
        >
          <PlusCircle size={20} />
          Post New Internship
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleCardClick(stat.filter)}
            className={`cursor-pointer p-6 rounded-xl border shadow-sm flex flex-col gap-4 transition-all duration-200 ${
              activeFilter === stat.filter 
                ? 'bg-primary/5 border-primary ring-1 ring-primary/20 scale-[1.02]' 
                : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                stat.trend.includes('+') ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50'
              } px-2 py-1 rounded-full`}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Monthly Application Trends</h3>
              <p className="text-xs text-slate-500">Tracking application volume over the last 6 months</p>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
            {trends.length > 0 ? (
              trends.map((trend, i) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = months[new Date(trend.month + '-01').getMonth()] || 'Month';
                const isCurrentMonth = i === trends.length - 1;
                
                return (
                  <div key={trend.month} className="relative z-10 flex flex-col items-center flex-1 h-full justify-end group">
                    <div 
                      className={`w-full max-w-[40px] transition-all duration-300 rounded-t-md relative ${
                        isCurrentMonth ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/20 hover:bg-primary'
                      }`}
                      style={{ height: `${Math.max(10, Math.min((trend.applications || 1) * 10, 100))}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {trend.applications} Applicants
                      </div>
                    </div>
                    <span className={`text-xs mt-2 ${isCurrentMonth ? 'font-bold text-primary' : 'text-slate-500'}`}>
                      {monthName}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm italic">
                No trend data available yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Application Status</h3>
            <p className="text-xs text-slate-500">Current distribution of applicants</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative h-48 w-48">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f5f9" strokeWidth="12"></circle>
                {/* Pending */}
                <circle 
                  cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" 
                  strokeWidth="12"
                  strokeDasharray={`${(pendingPercent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={0}
                ></circle>
                {/* Shortlisted */}
                <circle 
                  cx="50" cy="50" fill="transparent" r="40" stroke="#13eca4" 
                  strokeWidth="12"
                  strokeDasharray={`${(shortlistedPercent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-(pendingPercent / 100) * circumference}
                ></circle>
                {/* Rejected */}
                <circle 
                  cx="50" cy="50" fill="transparent" r="40" stroke="#ef4444" 
                  strokeWidth="12"
                  strokeDasharray={`${(rejectedPercent / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-((pendingPercent + shortlistedPercent) / 100) * circumference}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-slate-900">{totalApps}</span>
                <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Pending Review</span>
              </div>
              <span className="font-semibold text-slate-900">{pendingPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-slate-600">Shortlisted</span>
              </div>
              <span className="font-semibold text-slate-900">{shortlistedPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">Rejected</span>
              </div>
              <span className="font-semibold text-slate-900">{rejectedPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">
              {activeFilter === 'all' ? 'Your Internships' : activeFilter === 'active' ? 'Active Internships' : 'Expired Internships'}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-primary text-background-dark' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'active' ? 'bg-primary text-background-dark' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveFilter('expired')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'expired' ? 'bg-primary text-background-dark' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                Expired
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredInternships.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FilePlus size={32} />
                </div>
                <p className="text-slate-500 font-medium">No {activeFilter !== 'all' ? activeFilter : ''} internships found.</p>
                <Link to="/company/post" className="text-primary font-bold hover:underline mt-2 inline-block">Post your first internship</Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Internship Title</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
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
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                              <PlusCircle size={20} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                              <p className="text-xs text-slate-500">{job.location} • {job.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
                                <span className="text-xs font-medium text-slate-500">{job.applications_count || 0}</span>
                              </div>
                              <span className="text-xs text-slate-400 font-medium">Applicants</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${
                            job.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-800 ring-amber-600/20'
                          }`}>
                            {job.status === 'active' ? 'Active' : 'Draft/Expired'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(job.id);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                              title="More options"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            <AnimatePresence>
                              {activeDropdown === job.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-50 overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button 
                                    onClick={() => {
                                      navigate(`/company/post/${job.id}`);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Edit3 size={14} />
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setDeleteId(job.id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
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

        <div className="lg:w-80 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Applicants</h3>
            <div className="space-y-4">
              {recentApplications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent applicants.</p>
              ) : (
                recentApplications.map((app, i) => (
                  <div key={app.id} className="flex items-start gap-3">
                    <img 
                      className="h-10 w-10 rounded-full object-cover" 
                      src={app.student_image || `https://picsum.photos/seed/app${i}/40/40`} 
                      alt="Applicant" 
                    />
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/company/student/${app.student_id}`}
                        className="text-sm font-medium text-slate-900 truncate hover:text-primary transition-colors block"
                      >
                        {app.student_name}
                      </Link>
                      <p className="text-xs text-slate-500 truncate">Applied for {app.internship_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link 
              to="/company/applicants"
              className="w-full mt-4 text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors block"
            >
              View All Activity
            </Link>
          </div>
          <div className="bg-emerald-500 rounded-xl p-6 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Lightbulb size={20} className="text-white" />
              </div>
              <h4 className="font-black text-sm uppercase tracking-wider">Hiring Tip</h4>
            </div>
            <p className="text-xs text-white/90 leading-relaxed mb-4 font-medium">
              Companies with detailed internship descriptions get 40% more qualified applicants. Make your titles catchy!
            </p>
            <Link className="text-xs font-bold text-primary hover:underline flex items-center gap-1" to="/company/settings">
              Edit your profile <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                    <AlertTriangle size={32} />
                  </div>
                  <button 
                    onClick={() => setDeleteId(null)}
                    disabled={isDeleting}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Post?</h3>
                <p className="text-slate-500 mt-3 leading-relaxed font-medium">
                  This action is permanent. All applicant data for this internship will be archived and the listing will be removed from search results.
                </p>
              </div>
              <div className="bg-slate-50 p-8 flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Keep Post
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 size={16} className="animate-spin" />}
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
