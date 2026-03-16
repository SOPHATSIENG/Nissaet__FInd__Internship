import { Bookmark, BriefcaseBusiness, Calendar, Clock3, Code2, MapPin, Share2, WalletCards } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  stipend: number | null;
  stipend_currency: string | null;
  application_deadline: string | null;
  created_at: string;
  skills?: Skill[];
};

export default function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<InternshipRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    fetchInternship();
  }, [id]);

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

  const getPostedTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      alert('Please write a cover letter before applying.');
      return;
    }

    setIsApplying(true);
    try {
      await api.applyForInternship(id, coverLetter);
      alert('Application submitted successfully!');
      setShowApplyModal(false);
      setCoverLetter('');
      navigate('/student/internships');
    } catch (error) {
      console.error('Error applying:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
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
              className="h-12 px-5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium"
            >
              <Bookmark size={18} />
              Save
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
              {internshipType.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Title and Company */}
        <div className="px-6 md:px-8 py-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <img
              src={internship.company_logo || `https://picsum.photos/seed/company-${internship.company_id}/120/120`}
              alt={`${internship.company_name} logo`}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
                {internship.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-lg text-slate-500">
                <Link to={`/companies/${internship.company_id}`} className="text-[#3b82f6] font-bold hover:underline transition-colors">
                  {internship.company_name}
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock3 size={18} /> Posted {getPostedTime(internship.created_at)}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {internshipType.replace('-', ' ')} • {internship.location}
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
            onClick={() => setShowApplyModal(true)}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xl md:text-lg px-10 py-3 rounded-2xl shadow-[0_8px_24px_rgba(67,56,202,0.35)] transition-colors"
          >
            Apply for this Internship
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
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying || !coverLetter.trim()}
                  className="px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
