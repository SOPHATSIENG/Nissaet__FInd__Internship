import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  Calendar,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import type { ProfileSettingsPayload } from '../../components/settings/types';

const EMPTY_SETTINGS: ProfileSettingsPayload = {
  personal: {
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    bio: '',
    profile_image: '',
    role: 'student',
  },
  education: {
    education: '',
    university: '',
    major: '',
    graduation_year: '',
    gpa: '',
    resume_url: '',
    linkedin_url: '',
    portfolio_url: '',
    is_available: true,
  },
  skills: [],
  notifications: {
    internship_matches_email: true,
    internship_matches_in_app: true,
    application_status_email: true,
    application_status_in_app: true,
    career_tips_email: false,
    career_tips_in_app: false,
    frequency: 'Daily',
  },
  security: {
    two_factor_enabled: false,
  },
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ProfileSettingsPayload>(EMPTY_SETTINGS);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const [
        settingsResult,
        savedResult,
        applicationsResult,
        recommendedResult,
        matchingResult,
        eventsResult,
      ] = await Promise.allSettled([
        api.getProfileSettings(),
        api.getSavedInternships(),
        api.getMyApplications({ limit: 100 }),
        api.getRecommendedInternships(),
        api.getMatchingInternships(),
        api.getUpcomingEvents(),
      ]);

      if (!isMounted) return;

      if (settingsResult.status === 'fulfilled' && settingsResult.value?.settings) {
        setSettings((previous) => ({ ...previous, ...settingsResult.value.settings }));
      }

      if (savedResult.status === 'fulfilled') {
        const list = Array.isArray(savedResult.value?.internships)
          ? savedResult.value.internships
          : Array.isArray(savedResult.value)
            ? savedResult.value
            : [];
        setSavedInternships(list);
      }

      if (applicationsResult.status === 'fulfilled') {
        const list = Array.isArray(applicationsResult.value?.applications)
          ? applicationsResult.value.applications
          : Array.isArray(applicationsResult.value)
            ? applicationsResult.value
            : [];
        setApplications(list);
      }

      const recommendedList = recommendedResult.status === 'fulfilled'
        ? (Array.isArray(recommendedResult.value?.internships)
            ? recommendedResult.value.internships
            : Array.isArray(recommendedResult.value)
              ? recommendedResult.value
              : [])
        : [];

      const matchingList = matchingResult.status === 'fulfilled'
        ? (Array.isArray(matchingResult.value?.internships)
            ? matchingResult.value.internships
            : Array.isArray(matchingResult.value)
              ? matchingResult.value
              : [])
        : [];

      setRecommendedInternships(recommendedList.length ? recommendedList : matchingList);

      if (eventsResult.status === 'fulfilled') {
        const list = Array.isArray(eventsResult.value)
          ? eventsResult.value
          : Array.isArray(eventsResult.value?.data)
            ? eventsResult.value.data
            : [];
        setUpcomingEvents(list);
      }

      const errors = [
        settingsResult.status === 'rejected' ? 'Failed to load profile settings.' : null,
        savedResult.status === 'rejected' ? 'Failed to load saved internships.' : null,
        applicationsResult.status === 'rejected' ? 'Failed to load applications.' : null,
      ].filter(Boolean);

      setError(errors.length ? errors.join(' ') : '');
      setLoading(false);
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const profile = settings.personal;
  const education = settings.education;
  const skills = settings.skills || [];

  const profileCompletion = useMemo(() => {
    const checks = [
      profile.full_name,
      profile.email,
      profile.phone,
      profile.address,
      profile.bio,
      profile.profile_image,
      education.university,
      education.major,
      education.graduation_year,
      education.resume_url,
      skills.length > 0 ? 'ok' : '',
    ];
    const completed = checks.filter((value) => Boolean(String(value || '').trim())).length;
    return Math.round((completed / checks.length) * 100);
  }, [profile, education, skills]);

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [applications]);

  const quickStats = [
    {
      label: 'Applications',
      value: applications.length,
      icon: ClipboardList,
      bg: 'bg-indigo-50',
      color: 'text-indigo-600',
      to: '/account-settings?tab=applications',
    },
    {
      label: 'Saved',
      value: savedInternships.length,
      icon: Bookmark,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      to: '/account-settings?tab=saved',
    },
    {
      label: 'Recommended',
      value: recommendedInternships.length,
      icon: Sparkles,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      to: '/internships',
    },
    {
      label: 'Profile Completion',
      value: `${profileCompletion}%`,
      icon: BadgeCheck,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      to: '/account-settings',
    },
  ];

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
            <p className="text-slate-500 mt-2">
              Welcome back{profile.full_name ? `, ${profile.full_name}` : ''}. Track your profile, applications, and saved opportunities.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/account-settings"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Update Profile
            </Link>
            <Link
              to="/internships"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Internships
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className={`relative h-16 w-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center ${education.is_available ? 'ring-2 ring-emerald-400' : ''}`}>
                {(profile.profile_image || user?.profile_image) ? (
                  <img
                    src={profile.profile_image || user?.profile_image}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-8 w-8 text-slate-400" />
                )}
                {education.is_available && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Open to work
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {profile.full_name || user?.full_name || user?.name || 'Student'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {education.major || 'Student'} {education.university ? `at ${education.university}` : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    education.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {education.is_available ? 'Open to internships' : 'Not available'}
                  </span>
                  {education.graduation_year && (
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700">
                      Graduation {education.graduation_year}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{profile.email || user?.email || 'Email not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{profile.phone || 'Phone not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="truncate">{profile.address || 'Location not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                <span className="truncate">{education.education || education.major || 'Education not set'}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span>Profile completion</span>
                <span className="font-semibold text-slate-700">{profileCompletion}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Skills</p>
              {skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 8).map((skill) => (
                    <span key={`${skill.name}-${skill.id || 'skill'}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Add skills to get better internship matches.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickStats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.to}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </Link>
            ))}

            <div className="sm:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold">Stand out to employers</h3>
              <p className="text-sm text-white/90 mt-1">
                Complete your profile and keep skills updated to receive higher quality internship matches.
              </p>
              <div className="mt-4">
                <Link
                  to="/account-settings"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Improve Profile <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Recent Applications</h3>
                    <p className="text-xs text-slate-500">Track the latest internships you applied to.</p>
                  </div>
                  <Link to="/account-settings" className="text-sm font-semibold text-blue-600 hover:underline">
                    View all
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {recentApplications.length === 0 ? (
                    <div className="px-6 py-10 text-sm text-slate-500">
                      You have not applied to any internships yet.
                    </div>
                  ) : (
                    recentApplications.map((app) => (
                      <div key={app.id} className="px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{app.title || app.internship_title || 'Internship'}</p>
                          <p className="text-sm text-slate-500">
                            {app.company_name || 'Company'} {app.location ? `• ${app.location}` : ''}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Applied on {formatDate(app.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            app.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : app.status === 'rejected'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-600'
                          }`}>
                            {app.status || 'pending'}
                          </span>
                          {app.internship_id && (
                            <Link to={`/internships/${app.internship_id}`} className="text-sm font-semibold text-slate-700 hover:text-blue-600">
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Recommended Internships</h3>
                    <p className="text-xs text-slate-500">Opportunities tailored to your skills.</p>
                  </div>
                  <Link to="/internships" className="text-sm font-semibold text-blue-600 hover:underline">
                    Explore
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {recommendedInternships.length === 0 ? (
                    <div className="px-6 py-10 text-sm text-slate-500">
                      Add skills to your profile to get personalized matches.
                    </div>
                  ) : (
                    recommendedInternships.slice(0, 4).map((job) => (
                      <Link
                        key={job.id}
                        to={`/internships/${job.id}`}
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                            {job.company_logo ? (
                              <img src={job.company_logo} alt={job.company_name} className="h-full w-full object-cover" />
                            ) : (
                              <Briefcase className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{job.title || 'Internship'}</p>
                            <p className="text-sm text-slate-500">{job.company_name || 'Company'} {job.location ? `• ${job.location}` : ''}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Saved Internships</h3>
                    <p className="text-xs text-slate-500">Keep track of opportunities you bookmarked.</p>
                  </div>
                  <Link to="/account-settings" className="text-sm font-semibold text-blue-600 hover:underline">
                    Manage
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {savedInternships.length === 0 ? (
                    <div className="px-6 py-10 text-sm text-slate-500">
                      You have not saved any internships yet.
                    </div>
                  ) : (
                    savedInternships.slice(0, 4).map((job) => (
                      <Link
                        key={job.id}
                        to={`/internships/${job.id}`}
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{job.title || 'Internship'}</p>
                          <p className="text-sm text-slate-500">{job.company_name || 'Company'} {job.location ? `• ${job.location}` : ''}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Upcoming Events</h3>
                    <p className="text-xs text-slate-500">Workshops and career events for students.</p>
                  </div>
                  <Link to="/events" className="text-sm font-semibold text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {upcomingEvents.length === 0 ? (
                    <div className="px-6 py-10 text-sm text-slate-500">
                      No upcoming events right now.
                    </div>
                  ) : (
                    upcomingEvents.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        to={`/events/${event.id}`}
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{event.title || 'Event'}</p>
                            <p className="text-xs text-slate-500">{formatDate(event.event_date)}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
