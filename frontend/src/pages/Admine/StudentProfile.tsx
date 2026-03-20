import React, { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Download,
  ArrowLeft,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Award,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const StudentProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<any | null>(null);
  const [meta, setMeta] = useState<{ createdAt?: string } | null>(null);

  const userId = searchParams.get('userId');

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!userId) {
        setLoadError('Missing student id.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setLoadError('');
        const data = await api.adminGetStudentProfile(userId);
        if (!mounted) return;
        const nextProfile = data?.profile || data?.settings || data;
        setProfile(nextProfile || null);
        setMeta(data?.meta || null);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setLoadError('Failed to load student profile.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const personal = profile?.personal || {};
  const education = profile?.education || {};
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];

  const fullName = personal.full_name || 'Student';
  const headlineParts = [education.major || education.education || 'Student', education.university].filter(Boolean);
  const headline = headlineParts.length > 0 ? headlineParts.join(' at ') : 'Student';
  const joinedLabel = meta?.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Unknown';
  const locationLabel = personal.address || 'Not provided';

  const initials = useMemo(() => getInitials(fullName), [fullName]);
  const profileImage = personal.profile_image || '';

  const resumeUrl = education.resume_url || '';
  const linkedinUrl = education.linkedin_url || '';
  const portfolioUrl = education.portfolio_url || '';

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm font-bold text-text-secondary-light">
        Loading student profile...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm font-bold text-rose-600">
        {loadError}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 overflow-y-auto no-scrollbar max-w-6xl mx-auto w-full">
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light bg-surface-light text-text-secondary-light text-sm font-bold hover:bg-background-light transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="size-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-1 shadow-lg">
            <div className="size-full rounded-2xl bg-surface-light flex items-center justify-center overflow-hidden font-black text-3xl text-blue-600">
              {profileImage ? (
                <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-text-primary-light tracking-tight">{fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">Active Student</span>
            </div>
            <p className="text-text-secondary-light text-lg font-medium">{headline}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary-light">
                <MapPin className="size-3.5" /> {locationLabel}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary-light">
                <Calendar className="size-3.5" /> Joined {joinedLabel}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light bg-surface-light text-text-secondary-light text-sm font-bold hover:bg-background-light transition-colors">
            <Mail className="size-4" /> Message
          </button>
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface-dark text-sm font-bold shadow-md hover:bg-emerald-400 transition-all"
            >
              <Download className="size-4" /> Download CV
            </a>
          ) : (
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/40 text-surface-dark text-sm font-bold shadow-md cursor-not-allowed">
              <Download className="size-4" /> No CV
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="flex flex-col gap-4 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light flex items-center gap-2">
              <BookOpen className="size-5 text-primary" /> About Me
            </h3>
            <p className="text-text-secondary-light leading-relaxed">
              {personal.bio || 'No bio provided yet.'}
            </p>
          </section>

          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" /> Education
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <GraduationCap className="size-6" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-text-primary-light">{education.education || 'Education'}</h4>
                  <p className="text-sm text-text-secondary-light">
                    {education.university || 'University'}{education.graduation_year ? ` • ${education.graduation_year}` : ''}
                  </p>
                  <p className="text-xs text-text-secondary-light mt-1 font-medium">
                    {education.gpa ? `GPA: ${education.gpa}` : 'GPA: N/A'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light flex items-center gap-2">
              <Award className="size-5 text-primary" /> Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill: any) => (
                  <span key={skill.id || skill.name} className="px-4 py-2 rounded-xl bg-background-light border border-border-light text-sm font-bold text-text-primary-light">
                    {skill.name}
                  </span>
                ))
              ) : (
                <span className="px-4 py-2 rounded-xl bg-background-light border border-border-light text-sm font-bold text-text-secondary-light">
                  No skills listed
                </span>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-8">
          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light">Contact Info</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-background-light flex items-center justify-center text-text-secondary-light">
                  <Mail className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-secondary-light uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-text-primary-light">{personal.email || 'Not provided'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-background-light flex items-center justify-center text-text-secondary-light">
                  <Phone className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-secondary-light uppercase tracking-wider">Phone</span>
                  <span className="text-sm font-medium text-text-primary-light">{personal.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light">Social Links</h3>
            <div className="flex flex-col gap-3">
              <a
                href={linkedinUrl || '#'}
                target={linkedinUrl ? '_blank' : undefined}
                rel={linkedinUrl ? 'noreferrer' : undefined}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors group",
                  linkedinUrl ? "hover:bg-background-light" : "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (!linkedinUrl) e.preventDefault();
                }}
              >
                <div className="flex items-center gap-3">
                  <Linkedin className="size-5 text-text-secondary-light group-hover:text-[#0077b5]" />
                  <span className="text-sm font-bold text-text-primary-light">LinkedIn</span>
                </div>
                <ExternalLink className="size-4 text-border-light group-hover:text-text-secondary-light" />
              </a>
              <a
                href={resumeUrl || '#'}
                target={resumeUrl ? '_blank' : undefined}
                rel={resumeUrl ? 'noreferrer' : undefined}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors group",
                  resumeUrl ? "hover:bg-background-light" : "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (!resumeUrl) e.preventDefault();
                }}
              >
                <div className="flex items-center gap-3">
                  <Github className="size-5 text-text-secondary-light group-hover:text-[#333]" />
                  <span className="text-sm font-bold text-text-primary-light">Resume</span>
                </div>
                <ExternalLink className="size-4 text-border-light group-hover:text-text-secondary-light" />
              </a>
              <a
                href={portfolioUrl || '#'}
                target={portfolioUrl ? '_blank' : undefined}
                rel={portfolioUrl ? 'noreferrer' : undefined}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors group",
                  portfolioUrl ? "hover:bg-background-light" : "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (!portfolioUrl) e.preventDefault();
                }}
              >
                <div className="flex items-center gap-3">
                  <Globe className="size-5 text-text-secondary-light group-hover:text-primary" />
                  <span className="text-sm font-bold text-text-primary-light">Portfolio</span>
                </div>
                <ExternalLink className="size-4 text-border-light group-hover:text-text-secondary-light" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
