import React, { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Hourglass,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function MyApplications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [applications] = useState([
    {
      id: 1,
      internshipTitle: 'Marketing Intern',
      company: 'ABA Bank',
      location: 'Phnom Penh',
      appliedDate: 'Oct 24, 2023',
      status: 'Pending Review',
      duration: '3 Months',
      type: 'Full-time',
      logo: 'https://picsum.photos/seed/aba/100/100'
    },
    {
      id: 2,
      internshipTitle: 'Web Developer',
      company: 'Smart Axiata',
      location: 'Remote',
      appliedDate: 'Oct 20, 2023',
      status: 'Shortlisted',
      duration: '6 Months',
      type: 'Part-time',
      logo: 'https://picsum.photos/seed/smart/100/100'
    },
    {
      id: 3,
      internshipTitle: 'Graphic Designer',
      company: 'Canadia Bank',
      location: 'Siem Reap',
      appliedDate: 'Oct 15, 2023',
      status: 'Rejected',
      duration: '3 Months',
      type: 'Internship',
      logo: 'https://picsum.photos/seed/canadia/100/100'
    },
    {
      id: 4,
      internshipTitle: 'Data Analyst',
      company: 'Chip Mong Group',
      location: 'Phnom Penh',
      appliedDate: 'Oct 10, 2023',
      status: 'Pending Review',
      duration: '4 Months',
      type: 'Full-time',
      logo: 'https://picsum.photos/seed/chipmong/100/100'
    }
  ]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Shortlisted':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          ring: 'ring-emerald-600/20',
          icon: CheckCircle
        };
      case 'Rejected':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          ring: 'ring-red-600/20',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          ring: 'ring-amber-600/20',
          icon: Hourglass
        };
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Applications</h1>
          <p className="text-slate-500 mt-1">Track the status of your internship applications in one place.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search by role or company..."
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="flex-1 md:w-48 py-2 pl-3 pr-10 border border-slate-200 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app, index) => {
            const styles = getStatusStyles(app.status);
            const StatusIcon = styles.icon;
            
            return (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={app.logo} alt={app.company} className="h-full w-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                        {app.internshipTitle}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${styles.bg} ${styles.text} ${styles.ring}`}>
                        <StatusIcon size={14} />
                        {app.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={16} className="text-slate-400" />
                        {app.company}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-slate-400" />
                        {app.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} className="text-slate-400" />
                        {app.duration} • {app.type}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-slate-400" />
                        Applied on {app.appliedDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <button className="flex-1 md:flex-none px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                      View Details
                    </button>
                    <Link 
                      to={`/evaluation/${app.id}`}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                    >
                      Check Evaluation
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No applications found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search or filter to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="mt-4 text-primary font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
