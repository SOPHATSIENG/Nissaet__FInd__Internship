import { Bookmark, BriefcaseBusiness, Calendar, Clock3, Code2, MapPin, Share2, WalletCards } from "lucide-react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

type Skill = {
  id: number;
  name: string;
  category: string;
  skill_level: string;
  is_required: boolean;
};

type InternshipRecord = {
  id: number;
  title: string;
  company_id: number;
  company_name: string;
  company_logo: string | null;
  company_description: string | null;
  company_website: string | null;
  location: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  type: string;
  work_mode: string;
  duration_months: number | null;
  duration?: number | string | null;
  stipend: number | null;
  stipend_currency: string | null;
  application_deadline: string | null;
  deadline?: string | null;
  created_at: string;
  skills?: Skill[];
};

type ApplicationInfo = {
  id: number;
  status: string;
  cover_letter?: string | null;
  created_at?: string | null;
  resume_url?: string | null;
};

export default function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [internship, setInternship] = useState<InternshipRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [editCoverLetter, setEditCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [applyError, setApplyError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [applicationInfo, setApplicationInfo] = useState<ApplicationInfo | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);
  const [isUpdatingApplication, setIsUpdatingApplication] = useState(false);
  const [isDeletingApplication, setIsDeletingApplication] = useState(false);

  useEffect(() => {
    fetchInternship();
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadSavedStatus = async () => {
      if (!id || !isAuthenticated) return;
      try {
        const res = await api.getSavedInternships();
        const saved = Array.isArray(res?.internships)
          ? res.internships.some((item: { id: number }) => String(item.id) === String(id))
          : false;
        if (mounted) setIsSaved(saved);
      } catch (error) {
        console.error('Error loading saved internships:', error);
      }
    };

    loadSavedStatus();
    return () => {
      mounted = false;
    };
  }, [id, isAuthenticated]);

  useEffect(() => {
    let mounted = true;

    const loadApplicationStatus = async () => {
      if (!id || !isAuthenticated || user?.role !== 'student') {
        if (mounted) {
          setApplicationInfo(null);
          setIsCheckingApplication(false);
        }
        return;
      }
      setIsCheckingApplication(true);
      try {
        const res = await api.getMyApplications({ limit: 1, internship_id: id });
        const application = Array.isArray(res?.applications) && res.applications.length > 0
          ? res.applications[0]
          : null;
        if (mounted) {
          setApplicationInfo(application);
          setEditCoverLetter(application?.cover_letter || '');
        }
      } catch (error) {
        console.error('Error loading application status:', error);
      } finally {
        if (mounted) setIsCheckingApplication(false);
      }
    };

    loadApplicationStatus();
    return () => {
      mounted = false;
    };
  }, [id, isAuthenticated, user?.role]);

  const fetchInternship = async () => {
    try {
      setLoading(true);
      const response = await api.getInternshipById(id);
      console.log('Internship response:', response);

      if (response.internship) {
        setInternship(response.internship);
      }
    } catch (error) {
      console.error('Error fetching internship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: location.pathname } });
      return;
    }

    if (user?.role !== 'student') {
      alert('Only students can apply for internships.');
      return;
    }

    setShowApplyModal(true);
  };

  const heroImage = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80';

  const salaryText = () => {
    if (!internship) return 'Unpaid';
    const stipend = Number(internship.stipend);
    if (!stipend || stipend === 0) return 'Unpaid';
    return `${internship.stipend_currency || '$'}${internship.stipend}/mo`;
  };

  const internshipType = internship?.work_mode || internship?.type || 'Internship';
  const internshipDuration = internship?.duration_months ?? internship?.duration ?? 'Variable';
  const applicationDeadline = internship?.application_deadline || internship?.deadline;
  const hasApplied = Boolean(applicationInfo);

  const getPostedTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const safeType = internship?.type ? internship.type.replace('-', ' ') : 'internship';
  const safePostedTime = internship?.created_at ? getPostedTime(internship.created_at) : 'recently';
  const safeCompanyName = internship?.company_name || 'Company';

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      alert('Please write a cover letter before applying.');
      return;
    }

    setIsApplying(true);
    setResumeError('');
    setApplyError('');
    try {
      let resumeUrl = null;
      if (resumeFile) {
        setResumeUploading(true);
        const uploadResponse = await api.uploadResume(resumeFile);
        resumeUrl = uploadResponse?.url || null;
      }

      const applyResponse = resumeUrl
        ? await api.applyForInternshipWithResume(id, coverLetter, resumeUrl)
        : await api.applyForInternship(id, coverLetter);
      alert('Application submitted successfully!');
      setApplicationInfo({
        id: applyResponse?.applicationId || Date.now(),
        status: 'pending',
        cover_letter: coverLetter,
        resume_url: resumeUrl,
        created_at: new Date().toISOString(),
      });
      setShowApplyModal(false);
      setCoverLetter('');
      setResumeFile(null);
      if (id) {
        navigate(`/internships/${id}`);
      }
    } catch (error: any) {
      console.error('Error applying:', error);
      const message = error?.message || 'Failed to submit application. Please try again.';
      setApplyError(message);
      alert(message);
    } finally {
      setResumeUploading(false);
      setIsApplying(false);
    }
  };

  const handleUpdateApplication = async () => {
    if (!applicationInfo?.id) return;
    setIsUpdatingApplication(true);
    try {
      await api.updateMyApplication(applicationInfo.id, editCoverLetter);
      setApplicationInfo((prev) => prev ? { ...prev, cover_letter: editCoverLetter } : prev);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application. Please try again.');
    } finally {
      setIsUpdatingApplication(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!applicationInfo?.id && !id) return;
    setIsDeletingApplication(true);
    try {
      if (applicationInfo?.id) {
        await api.deleteMyApplication(applicationInfo.id);
      } else if (id) {
        await api.deleteMyApplicationByInternship(id);
      }
      setApplicationInfo(null);
      setEditCoverLetter('');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting application:', error);
      if (error?.message && error.message.includes('404') && id) {
        try {
          await api.deleteMyApplicationByInternship(id);
          setApplicationInfo(null);
          setEditCoverLetter('');
          setShowDeleteModal(false);
          return;
        } catch (fallbackError) {
          console.error('Error deleting application by internship:', fallbackError);
          alert(fallbackError?.message || 'Failed to delete application. Please try again.');
          return;
        }
      }
      alert(error?.message || 'Failed to delete application. Please try again.');
    } finally {
      setIsDeletingApplication(false);
    }
  };

  const handleToggleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await api.unsaveInternship(id);
        setIsSaved(false);
      } else {
        await api.saveInternship(id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error updating saved status:', error);
      alert('Failed to update saved status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#f3f5f8] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="max-w-[1180px] mx-auto flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
        </div>
      ) : internship ? (
        <div className="max-w-[1180px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BriefcaseBusiness size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Internship Details</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
              aria-label="Share internship"
            >
              <Share2 size={20} />
            </button>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={isSaving}
              className={`h-12 px-5 rounded-xl transition-colors flex items-center gap-2 font-medium ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Bookmark size={18} />
              {isSaved ? 'Unsave' : 'Save'}
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="p-6 md:p-8 border-b border-slate-200">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={heroImage}
              alt={`${internship.title} banner`}
              className="w-full h-[220px] md:h-[360px] object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute left-6 bottom-6 bg-[#3b82f6] text-white text-base font-bold px-5 py-2 rounded-full uppercase tracking-wide shadow-lg">
              {safeType}
            </span>
          </div>
        </div>

        {/* Title and Company */}
        <div className="px-6 md:px-8 py-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <img
              src={internship.company_logo || `https://picsum.photos/seed/company-${internship.company_id}/120/120`}
              alt={`${safeCompanyName} logo`}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                {internship.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-lg text-slate-500">
                <Link to={`/companies/${internship.company_id}`} className="text-[#3b82f6] font-bold hover:underline transition-colors">
                  {safeCompanyName}
                </Link>
                <span>-</span>
                <span className="flex items-center gap-1.5">
                  <Clock3 size={18} /> Posted {safePostedTime}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {internshipType.replace('-', ' ')} - {internship.location}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-slate-800">{internship.location} ({internship.work_mode || internship.type})</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <Clock3 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                <p className="text-sm font-semibold text-slate-800">{internshipDuration && internshipDuration !== 'Variable' ? `${internshipDuration} Months` : 'Variable'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <WalletCards size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stipend</p>
                <p className="text-sm font-semibold text-slate-800">{salaryText()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline</p>
                <p className="text-sm font-semibold text-slate-800">{applicationDeadline ? new Date(applicationDeadline).toLocaleDateString() : 'Open Until Filled'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}

        {/* Content Section */}
        <div className="px-6 md:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">About the Role</h3>
                <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                  {internship.description}
                </div>
              </section>

              {internship.responsibilities && (
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Responsibilities</h3>
                  <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                    {internship.responsibilities}
                  </div>
                </section>
              )}

              {internship.requirements && (
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h3>
                  <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                    {internship.requirements}
                  </div>
                </section>
              )}

              {internship.benefits && (
                <section>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Benefits</h3>
                  <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                    {internship.benefits}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-8">
              {internship.skills && internship.skills.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Code2 className="text-[#3b82f6]" size={22} />
                    Skills Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                          skill.is_required 
                            ? "bg-blue-50 border-blue-100 text-blue-700" 
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                        title={skill.is_required ? "Required Skill" : "Preferred Skill"}
                      >
                        {skill.name}
                        {skill.is_required && <span className="ml-1 text-[10px] uppercase opacity-60">*</span>}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-slate-400 italic">* Required skills</p>
                </div>
              )}

              {hasApplied && (
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                  <h3 className="text-xl font-bold text-emerald-900 mb-3">Your Application</h3>
                  <p className="text-sm text-emerald-800 font-semibold">
                    Status: {applicationInfo?.status || 'pending'}
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Applied on{' '}
                    {applicationInfo?.created_at
                      ? new Date(applicationInfo.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  {applicationInfo?.cover_letter && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-2">
                        Cover Letter
                      </p>
                      <p className="text-sm text-emerald-900 whitespace-pre-line">
                        {applicationInfo.cover_letter}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      Edit Application
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeletingApplication}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isDeletingApplication ? 'Deleting...' : 'Delete Application'}
                    </button>
                    <Link
                      to="/account-settings"
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      View in My Applications
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-[#3b82f6]/5 p-6 rounded-2xl border border-[#3b82f6]/10 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-4">About the Company</h3>
                <p className="text-slate-600 text-sm mb-6 line-clamp-4">
                  {internship.company_description || "Information about this company is currently not available."}
                </p>
                <Link to={`/companies/${internship.company_id}`} className="block text-center bg-white border border-slate-200 text-slate-800 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">
                  View Company Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky-like Footer Action Bar */}
        <div className="px-6 md:px-8 py-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="hidden sm:block">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Apply By</p>
              <p className="text-lg font-bold text-slate-900">{applicationDeadline ? new Date(applicationDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Always Open'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={hasApplied || isCheckingApplication}
            className={`font-bold text-xl md:text-lg px-10 py-3 rounded-2xl transition-colors ${
              hasApplied
                ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-[0_8px_24px_rgba(67,56,202,0.35)]'
            } ${isCheckingApplication ? 'opacity-70 cursor-wait' : ''}`}
          >
            {hasApplied ? 'Application Submitted' : 'Apply for this Internship'}
          </button>
        </div>
      </div>
      )
      : (
        <div className="max-w-[1180px] mx-auto flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Internship Not Found</h2>
            <p className="text-slate-600">The internship you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/student/internships')}
              className="mt-4 px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors"
            >
              Back to Internships
            </button>
          </div>
        </div>
      )}
      
      {/* Apply Modal */}
      {showApplyModal && internship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Apply for {internship.title}</h2>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tell us why you're interested in this internship and why you'd be a good fit..."
                />
                <p className="mt-2 text-sm text-gray-500">
                  Write a compelling cover letter that highlights your relevant skills and experience.
                </p>
              </div>

              {applyError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {applyError}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CV (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.type !== 'application/pdf') {
                      setResumeError('Only PDF files are allowed.');
                      setResumeFile(null);
                      return;
                    }
                    setResumeError('');
                    setResumeFile(file);
                  }}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {resumeFile && (
                  <p className="mt-2 text-sm text-gray-500">Selected: {resumeFile.name}</p>
                )}
                {resumeError && (
                  <p className="mt-2 text-sm text-red-600">{resumeError}</p>
                )}
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying || resumeUploading || !coverLetter.trim()}
                  className="px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resumeUploading ? 'Uploading CV...' : isApplying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {showEditModal && internship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Application</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editCoverLetter}
                  onChange={(e) => setEditCoverLetter(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Update your cover letter..."
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateApplication}
                  disabled={isUpdatingApplication || !editCoverLetter.trim()}
                  className="px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdatingApplication ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Application</h2>
              <p className="text-sm text-gray-600 mt-2">
                Delete your application? You can apply again after deleting.
              </p>
            </div>
            <div className="p-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteApplication}
                disabled={isDeletingApplication}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isDeletingApplication ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


