import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Star,
  Download,
  MessageSquare,
  ExternalLink,
  Award,
  CheckCircle2,
  Send,
  ArrowLeft,
  Loader2,
  Linkedin,
  Globe
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

export default function StudentProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.getStudentProfile(id);
        if (response && response.profile) {
          setProfile(response.profile);
        } else {
          setError('Profile not found');
        }
      } catch (err: any) {
        console.error('Error fetching student profile:', err);
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) return;
    setIsSubmitted(true);
    // In a real app, this would be an API call
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-slate-500 font-medium">Loading student profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col items-center justify-center gap-6">
        <div className="p-6 bg-red-50 rounded-2xl text-red-600 border border-red-100 max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'Something went wrong'}</p>
        </div>
        <Link to="/applicants" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
          <ArrowLeft size={18} />
          Back to Applicants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link 
          to="/applicants" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Applicants
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-50"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative group">
                <img 
                  className="h-32 w-32 rounded-3xl border-4 border-white shadow-lg object-cover bg-slate-100" 
                  src={profile.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=random&size=200`}
                  alt={profile.full_name} 
                />
                {profile.is_available && (
                  <>
                    <div className="absolute inset-0 rounded-3xl border-4 border-emerald-500/50 pointer-events-none"></div>
                    <div className="absolute -bottom-1 inset-x-0 mx-auto w-[90%] bg-emerald-500 text-white text-[10px] font-black py-1 px-2 rounded-lg shadow-lg flex items-center justify-center gap-1 border border-white uppercase tracking-tighter">
                      <CheckCircle2 size={10} strokeWidth={3} />
                      <span>Available</span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-center md:text-left pb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900">{profile.full_name}</h1>
                  {profile.is_available ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Open to work
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Not Looking for Internship
                    </span>
                  )}
                </div>
                <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                  <GraduationCap size={18} className="text-primary" />
                  {profile.education ? (profile.education.charAt(0).toUpperCase() + profile.education.slice(1).replace('_', ' ')) : 'Student'} at {profile.university || 'University'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-2">
              {profile.resume_url && (
                <a 
                  href={profile.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <ExternalLink size={18} />
                  View Resume
                </a>
              )}
              <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all">
                <MessageSquare size={18} />
                Contact Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Professional Summary</h3>
            <p className="text-slate-600 leading-relaxed">
              {profile.bio || `Highly motivated ${profile.major || 'Computer Science'} student with a strong foundation in their field. Looking for an internship opportunity to apply my technical skills and contribute to innovative projects while learning from industry professionals.`}
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Education</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <GraduationCap size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{profile.university || 'University'}</h4>
                    {profile.graduation_year && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Graduating {profile.graduation_year}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{profile.education ? (profile.education.charAt(0).toUpperCase() + profile.education.slice(1).replace('_', ' ')) : 'Degree'} in {profile.major || 'Major'}</p>
                  {profile.gpa && <p className="text-xs font-semibold text-primary mt-2">GPA: {profile.gpa}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Additional sections can be added here as the data becomes available */}
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Rate this Student</h3>
            {isSubmitted ? (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <CheckCircle2 className="mx-auto text-blue-500 mb-2" size={24} />
                <p className="text-sm font-bold text-blue-900">Rating Submitted!</p>
                <p className="text-xs text-blue-700 mt-1">Thank you for your feedback.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit Rating
                </button>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        size={32} 
                        className={`${
                          (hoverRating || userRating) >= star 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-slate-500">
                    {userRating === 0 ? 'Select a rating' : `You rated ${userRating} stars`}
                  </span>
                </div>
                <textarea
                  placeholder="Add a comment (optional)..."
                  className="w-full rounded-lg border-slate-200 text-sm focus:ring-primary focus:border-primary"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
                <button
                  type="submit"
                  disabled={userRating === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  Submit Rating
                </button>
              </form>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={18} className="text-slate-400" />
                {profile.email}
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={18} className="text-slate-400" />
                  {profile.phone}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={18} className="text-slate-400" />
                Phnom Penh, Cambodia
              </div>
              <div className="pt-2 flex gap-3">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-[#0077b5] hover:bg-[#0077b5]/10 rounded-lg transition-all">
                    <Linkedin size={20} />
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                    <Globe size={20} />
                  </a>
                )}
              </div>
            </div>
          </section>

          {profile.skills && profile.skills.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: any) => (
                  <span key={skill.id} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-slate-100">
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
