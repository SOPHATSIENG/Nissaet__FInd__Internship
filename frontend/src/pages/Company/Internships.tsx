import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Filter, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';
import { useAuth } from '../../context/company-contexts/AuthContext';
import { useNotifications } from '../../context/company-contexts/NotificationContext';

export default function Internships() {
  const { user, profile } = useAuth();
  const { sendNotification } = useNotifications();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [myApplications, setMyApplications] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getInternships();
        const items = Array.isArray(res?.internships) ? res.internships : [];
        if (mounted) {
          setInternships(items);
        }
      } catch (error) {
        console.error('Error fetching internships:', error);
        if (mounted) {
          setInternships([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // DB mode: applications list is not wired yet.
    // Keep the UI working without Firebase.
    void user;
    setMyApplications([]);
  }, [user]);

  const handleApply = async (internship: any) => {
    if (!user || !profile) {
      alert('Please sign in to apply.');
      return;
    }

    if (profile.role !== 'student') {
      alert('Only students can apply for internships.');
      return;
    }

    setApplyingId(internship.id);
    try {
      setMyApplications(prev => [...prev, internship.id]);

      await sendNotification(
        String(internship.company_id || internship.companyId || ''),
        'New Application Received',
        `${user?.full_name || user?.name || 'A student'} has applied for your "${internship.title}" position.`,
        'info'
      );

      alert('Application saved locally (DB apply endpoint not implemented yet).');
    } catch (error) {
      console.error("Error applying:", error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredInternships = internships.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         String(job.company_name || job.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === '' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Explore Internships</h1>
        <p className="text-slate-500">Find the perfect opportunity to kickstart your career.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search by title, company, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg focus:ring-2 focus:ring-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="md:w-64 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Location..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg focus:ring-2 focus:ring-primary transition-all"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
        <button className="bg-primary text-background-dark px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
          <Filter size={20} />
          More Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredInternships.length > 0 ? (
            filteredInternships.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Briefcase size={32} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="text-slate-600 font-medium">{job.companyName}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={16} />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} />
                          {job.duration || '3-6 Months'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={16} />
                          {job.salary || 'Competitive'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3">
                    {myApplications.includes(job.id) ? (
                      <div className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                        <CheckCircle2 size={20} />
                        Applied
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleApply(job)}
                        disabled={applyingId === job.id}
                        className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-primary text-background-dark font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
                      >
                        {applyingId === job.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            Apply Now
                            <ChevronRight size={20} />
                          </>
                        )}
                      </button>
                    )}
                    <button className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition-all border border-slate-200">
                      View Details
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-4">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Search size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No internships found</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">
                  We couldn't find any internships matching your current search or filters.
                </p>
              </div>
              <button 
                onClick={() => { setSearchQuery(''); setLocationFilter(''); }}
                className="text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
