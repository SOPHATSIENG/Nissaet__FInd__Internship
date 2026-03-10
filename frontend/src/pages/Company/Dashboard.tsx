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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [stats, setStats] = useState([
    { label: 'Total Posted', value: '0', icon: FilePlus, color: 'text-blue-600', bg: 'bg-blue-50', trend: '0%' },
    { label: 'Total Applicants', value: '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '0%' },
    { label: 'Active Posts', value: '0', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Stable' },
    { label: 'Expired Posts', value: '0', icon: History, color: 'text-orange-600', bg: 'bg-orange-50', trend: '0%' },
  ]);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    console.log('Current user:', user);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [internshipsResponse, statsResponse, trendsResponse] = await Promise.all([
        api.getCompanyInternships(),
        api.getDashboardStats(),
        api.getApplicationTrends()
      ]);
      
      console.log('Internships response:', internshipsResponse);
      console.log('Stats response:', statsResponse);
      console.log('Trends response:', trendsResponse);
      
      setInternships(internshipsResponse.internships || []);
      
      // Update stats with real data
      if (statsResponse) {
        const newStats = [
          { 
            label: 'Total Posted', 
            value: statsResponse.totalPosted?.toString() || '0', 
            icon: FilePlus, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50', 
            trend: statsResponse.postsTrend || '0%' 
          },
          { 
            label: 'Total Applicants', 
            value: statsResponse.totalApplicants?.toString() || '0', 
            icon: Users, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50', 
            trend: '+15%' // Calculate this later if needed
          },
          { 
            label: 'Active Posts', 
            value: statsResponse.activePosts?.toString() || '0', 
            icon: CheckCircle, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50', 
            trend: 'Stable' 
          },
          { 
            label: 'Expired Posts', 
            value: statsResponse.expiredPosts?.toString() || '0', 
            icon: History, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50', 
            trend: '+5%' // Calculate this later if needed
          }
        ];
        setStats(newStats);
      }
      
      setTrends(trendsResponse.trends || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await api.deleteInternship(deleteId);
        setInternships(prev => prev.filter(item => item.id !== deleteId));
        setDeleteId(null);
        // Refresh all dashboard data
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting internship:', error);
        alert('Failed to delete internship. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
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
            className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-medium ${stat.trend === 'Stable' ? 'text-slate-500 bg-slate-50' : 'text-emerald-600 bg-emerald-50'} px-2 py-1 rounded-full`}>
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
            <select className="text-xs border-slate-200 bg-transparent rounded-lg text-slate-500 focus:ring-primary focus:border-primary">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="relative h-64 w-full flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
            {trends.length > 0 ? (
              trends.map((trend, i) => {
                // Get the last 6 months for display
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = months[new Date(trend.month + '-01').getMonth()] || 'Month';
                const isCurrentMonth = i === trends.length - 1;
                
                return (
                  <div key={trend.month} className="relative z-10 flex flex-col items-center flex-1 h-full justify-end group">
                    <div 
                      className={`w-full max-w-[40px] transition-all duration-300 rounded-t-md relative ${
                        isCurrentMonth ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/20 hover:bg-primary'
                      }`}
                      style={{ height: `${Math.min((trend.applications || 1) * 2, 100)}%` }}
                    >
                    </div>
                    <span className={`text-xs mt-2 ${isCurrentMonth ? 'font-bold text-primary' : 'text-slate-500'}`}>
                      {monthName}
                    </span>
                  </div>
                );
              })
            ) : (
              // Fallback to mock data if no trends available
              [30, 45, 35, 65, 80, 92].map((height, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center flex-1 h-full justify-end group">
                  <div 
                    className={`w-full max-w-[40px] transition-all duration-300 rounded-t-md relative ${i === 5 ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/20 hover:bg-primary'}`}
                    style={{ height: `${height}%` }}
                  >
                  </div>
                  <span className={`text-xs mt-2 ${i === 5 ? 'font-bold text-primary' : 'text-slate-500'}`}>
                    {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][i]}
                  </span>
                </div>
              ))
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
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#13eca4" strokeDasharray="37.7 251.3" strokeDashoffset="0" strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeDasharray="138.2 251.3" strokeDashoffset="-37.7" strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.find(s => s.label === 'Total Applicants')?.value || '0'}
                </span>
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
              <span className="font-semibold text-slate-900">55%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-slate-600">Approved</span>
              </div>
              <span className="font-semibold text-slate-900">30%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">Rejected</span>
              </div>
              <span className="font-semibold text-slate-900">15%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">Active Internships</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Filter size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : internships.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No internships posted yet. <Link to="/company/post" className="text-primary hover:underline">Post your first internship</Link>
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
                    {internships.map((job) => (
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
                          <div className="flex -space-x-2 overflow-hidden">
                            {job.applications_count > 0 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white">
                                <span className="text-xs font-medium text-slate-500">{job.applications_count}</span>
                              </div>
                            )}
                            {job.applications_count === 0 && (
                              <span className="text-xs text-slate-400">No applicants</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            job.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                          }`}>
                            {job.status === 'active' ? 'Active' : job.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => navigate(`/company/post/${job.id}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-primary transition-all"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeleteId(job.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
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

        <div className="lg:w-80 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Applicants</h3>
            <div className="space-y-4">
              {[
                { id: 1, name: 'Sophea Chan', role: 'Marketing Intern', time: '2 hours ago' },
                { id: 2, name: 'Dara Sok', role: 'Web Developer', time: '5 hours ago' },
                { id: 3, name: 'Vanna Ly', role: 'Data Analyst', time: '1 day ago' },
              ].map((app, i) => (
                <div key={i} className="flex items-start gap-3">
                  <img className="h-10 w-10 rounded-full object-cover" src={`https://picsum.photos/seed/app${i}/40/40`} alt="Applicant" />
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/student/${app.id}`}
                      className="text-sm font-medium text-slate-900 truncate hover:text-primary transition-colors block"
                    >
                      {app.name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">Applied for {app.role}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{app.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              View All Activity
            </button>
          </div>
          <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={20} className="text-primary" />
              <h4 className="font-bold text-slate-900 text-sm">Boost your visibility</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Companies with detailed internship descriptions get 40% more qualified applicants.
            </p>
            <a className="text-xs font-bold text-primary hover:underline flex items-center gap-1" href="#">
              Edit your profile <ArrowRight size={12} />
            </a>
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
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <button 
                    onClick={() => setDeleteId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Delete Internship Post?</h3>
                <p className="text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to delete this internship post? This action cannot be undone and all applicant data for this post will be archived.
                </p>
              </div>
              <div className="bg-slate-50 p-6 flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm shadow-red-200 transition-all"
                >
                  Delete Post
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
