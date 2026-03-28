import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  ShieldCheck,
  Save,
  User,
  Briefcase,
  Calendar,
  Globe,
  CheckCircle2,
  Clock,
  Activity,
  ChevronRight,
  ExternalLink,
  Bell,
  X,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';

export const ProfileSettings = () => {
  const { settings, updateSettings } = useProfile();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  
  // New States
  const [notifications, setNotifications] = useState({
    internshipEmail: false,
    internshipInApp: false,
    statusEmail: false,
    statusInApp: false,
    tipsEmail: false,
    tipsInApp: false,
  });
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({
          ...prev,
          [type === 'avatar' ? 'avatar' : 'coverImage']: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reload your latest profile data from the server?')) return;
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await api.getProfileSettings();
      const payload = response?.settings || response || {};
      const personal = payload.personal || {};
      setLocalSettings((prev) => ({
        ...prev,
        username: personal.username || prev.username,
        name: personal.full_name || prev.name,
        email: personal.email || prev.email,
        phone: personal.phone || prev.phone,
        location: personal.address || prev.location,
        bio: personal.bio || prev.bio,
        role: personal.role || prev.role,
        avatar: personal.profile_image || prev.avatar,
      }));
      updateSettings({
        username: personal.username || localSettings.username,
        name: personal.full_name || localSettings.name,
        email: personal.email || localSettings.email,
        phone: personal.phone || localSettings.phone,
        location: personal.address || localSettings.location,
        bio: personal.bio || localSettings.bio,
        role: personal.role || localSettings.role,
        avatar: personal.profile_image || localSettings.avatar,
        coverImage: localSettings.coverImage,
      });
      setIsTwoFactorEnabled(!!payload?.security?.two_factor_enabled);
      setNotifications({
        internshipEmail: !!payload?.notifications?.internship_matches_email,
        internshipInApp: !!payload?.notifications?.internship_matches_in_app,
        statusEmail: !!payload?.notifications?.application_status_email,
        statusInApp: !!payload?.notifications?.application_status_in_app,
        tipsEmail: !!payload?.notifications?.career_tips_email,
        tipsInApp: !!payload?.notifications?.career_tips_in_app,
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  const colors = [
    { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
    { name: 'Blue', value: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500/20' },
    { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500/20' },
    { name: 'Violet', value: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-500/20' },
    { name: 'Rose', value: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-500/20' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500/20' },
  ];

  const [activityLog, setActivityLog] = useState([
    { action: 'Recent activity will appear here.', date: '—', device: '—', icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' },
  ]);

  const timeAgo = (value?: string | null) => {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSave = async () => {
    setActionError('');
    setIsSaving(true);
    try {
      const fullName = (localSettings.name || '').trim();
      const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
      const lastName = rest.join(' ');
      const response = await api.updatePersonalSettings({
        username: localSettings.username || null,
        full_name: fullName,
        first_name: firstName || null,
        last_name: lastName || null,
        email: localSettings.email || null,
        phone: localSettings.phone || null,
        address: localSettings.location || null,
        bio: localSettings.bio || null,
        profile_image: localSettings.avatar || null,
        role: localSettings.role || null,
      });

      if (response?.settings?.personal) {
        const personal = response.settings.personal;
        updateSettings({
          username: personal.username || localSettings.username,
          name: personal.full_name || localSettings.name,
          email: personal.email || localSettings.email,
          phone: personal.phone || localSettings.phone,
          location: personal.address || localSettings.location,
          bio: personal.bio || localSettings.bio,
          role: personal.role || localSettings.role,
          avatar: personal.profile_image || localSettings.avatar,
          coverImage: localSettings.coverImage,
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('profile-settings-updated', {
              detail: response.settings,
            })
          );
        }
      } else {
        updateSettings(localSettings);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setActionError('Please complete all password fields.');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setActionError('New password and confirm password do not match.');
      return;
    }
    api.updatePassword({
      currentPassword: passwordForm.current,
      newPassword: passwordForm.new,
    })
      .then(() => {
        setIsChangePasswordOpen(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      })
      .catch((error) => {
        setActionError(error instanceof Error ? error.message : 'Failed to update password.');
      });
  };

  const accentColor = localSettings.accentColor;
  const theme = localSettings.theme;

  const stats = [
    { label: 'Verifications', value: '1,284', icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Reports Resolved', value: '456', icon: Activity, color: 'text-blue-500' },
    { label: 'Avg Response', value: '2.4h', icon: Clock, color: 'text-amber-500' },
  ];

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await api.getProfileSettings();
        const payload = response?.settings || response || {};
        const personal = payload.personal || {};
        if (!mounted) return;
        setLocalSettings((prev) => ({
          ...prev,
          username: personal.username || prev.username,
          name: personal.full_name || prev.name,
          email: personal.email || prev.email,
          phone: personal.phone || prev.phone,
          location: personal.address || prev.location,
          bio: personal.bio || prev.bio,
          role: personal.role || prev.role,
          avatar: personal.profile_image || prev.avatar,
        }));
        setIsTwoFactorEnabled(!!payload?.security?.two_factor_enabled);
        setNotifications({
          internshipEmail: !!payload?.notifications?.internship_matches_email,
          internshipInApp: !!payload?.notifications?.internship_matches_in_app,
          statusEmail: !!payload?.notifications?.application_status_email,
          statusInApp: !!payload?.notifications?.application_status_in_app,
          tipsEmail: !!payload?.notifications?.career_tips_email,
          tipsInApp: !!payload?.notifications?.career_tips_in_app,
        });
      } catch (error) {
        if (mounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load profile data.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadActivity = async () => {
      try {
        const data = await api.adminGetDashboardOverview();
        const items = Array.isArray(data?.activity) ? data.activity : [];
        if (!mounted || items.length === 0) return;
        const mapped = items.slice(0, 6).map((item: any, index: number) => ({
          action: item?.title || `Activity ${index + 1}`,
          date: timeAgo(item?.time),
          device: item?.desc || 'System',
          icon: Activity,
          color: 'text-blue-500',
          bg: 'bg-blue-50',
        }));
        setActivityLog(mapped);
      } catch (error) {
        // Keep fallback activity log
      }
    };
    loadActivity();
    return () => {
      mounted = false;
    };
  }, []);

  const notificationItems = useMemo(() => ([
    { id: 'internshipEmail', label: 'Internship Matches (Email)', desc: 'Email alerts for new matches', icon: Mail },
    { id: 'internshipInApp', label: 'Internship Matches (In-App)', desc: 'In-app alerts for new matches', icon: Bell },
    { id: 'statusEmail', label: 'Application Status (Email)', desc: 'Email alerts for application updates', icon: Mail },
    { id: 'statusInApp', label: 'Application Status (In-App)', desc: 'In-app alerts for application updates', icon: Bell },
    { id: 'tipsEmail', label: 'Career Tips (Email)', desc: 'Email digests with platform insights', icon: Mail },
    { id: 'tipsInApp', label: 'Career Tips (In-App)', desc: 'In-app tips and announcements', icon: Bell },
  ]), []);

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    setActionError('');
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try {
      await api.updateNotificationSettings({
        internship_matches_email: next.internshipEmail,
        internship_matches_in_app: next.internshipInApp,
        application_status_email: next.statusEmail,
        application_status_in_app: next.statusInApp,
        career_tips_email: next.tipsEmail,
        career_tips_in_app: next.tipsInApp,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update notifications.');
      setNotifications(notifications);
    }
  };

  const handleToggleTwoFactor = async () => {
    setActionError('');
    const nextValue = !isTwoFactorEnabled;
    setIsTwoFactorEnabled(nextValue);
    try {
      await api.updateTwoFactorSettings({ enabled: nextValue });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update two-factor settings.');
      setIsTwoFactorEnabled(!nextValue);
    }
  };

  return (
    <div className="admin-page">
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Loading profile...
        </div>
      )}
      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {loadError}
        </div>
      )}
      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {actionError}
        </div>
      )}
      {/* Header Section with Cover Photo */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-slate-800 to-slate-900 relative group overflow-hidden">
          {localSettings.coverImage ? (
            <img
              src={localSettings.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <input
            type="file"
            ref={coverInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'cover')}
          />
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white text-xs font-bold backdrop-blur-md transition-all border border-white/20"
          >
            <Camera className="size-3.5" /> Edit Cover
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 sm:px-8 pb-6">
          {/* Avatar + Action Buttons Row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar (overlapping cover) */}
            <div className="relative group shrink-0 -mt-12 sm:-mt-14">
              <div className="size-24 sm:size-28 rounded-2xl sm:rounded-3xl p-1 shadow-xl transition-all duration-300 bg-white border-4 border-white">
                <div className="size-full rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                  {localSettings.avatar ? (
                    <img src={localSettings.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-12 sm:size-14 text-slate-400" />
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 size-8 sm:size-9 rounded-xl text-white flex items-center justify-center shadow-lg border-2 border-white transition-all group-hover:scale-110 bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="size-3.5 sm:size-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-4">
              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                Reload
              </button>
              <button className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                View Profile
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "px-5 py-2 rounded-xl text-white text-sm font-bold shadow-md transition-all flex items-center gap-2",
                  showSuccess ? "bg-emerald-500" : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                )}
              >
                {isSaving ? <Save className="size-4 animate-pulse" /> : showSuccess ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
                {showSuccess ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Name, Role, Meta Info */}
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{localSettings.name}</h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                {localSettings.role}
              </span>
              <button
                onClick={() => document.getElementById('personal-info')?.scrollIntoView({ behavior: 'smooth' })}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-all"
                title="Edit profile"
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5"><Briefcase className="size-4 text-gray-400" /> Platform Administrator</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-gray-400" /> {localSettings.location}</span>
              <span className="flex items-center gap-1.5"><Calendar className="size-4 text-gray-400" /> Joined Jan 2023</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & About */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Stats Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Performance Overview</h3>
            <div className="grid grid-cols-1 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-border/50">
                  <div className={cn("size-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center", stat.color)}>
                    <stat.icon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-text-primary leading-none">{stat.value}</span>
                    <span className="text-xs font-bold text-text-secondary mt-1">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">About Me</h3>
            <textarea 
              value={localSettings.bio}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-white border border-border rounded-2xl px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-none leading-relaxed"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Social Links */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Social Presence</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Globe className="size-4" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Personal Website</span>
                </div>
                <ExternalLink className="size-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                    <Activity className="size-4" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">LinkedIn Profile</span>
                </div>
                <ExternalLink className="size-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Personal Information */}
          <div id="personal-info" className="bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-text-primary">Personal Information</h3>
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <User className="size-4" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input 
                    value={localSettings.username || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                    placeholder="username"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Full Name</label>
                <input 
                  value={localSettings.name}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input 
                    value={localSettings.email}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input 
                    value={localSettings.phone}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input 
                    value={localSettings.location}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                  <input 
                    value={localSettings.role}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-white border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Password</label>
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-text-primary text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-between group h-[46px]"
                >
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="text-xl leading-none mt-1">********</span>
                  </span>
                  <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                </button>
              </div>
            </div>
          </div>

          {/* Appearance & Customization */}
          <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-text-primary">Appearance & Branding</h3>
              <div className="size-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Accent Color</label>
                <div className="flex flex-wrap gap-4">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setLocalSettings(prev => ({ ...prev, accentColor: color.value }))}
                      className={cn(
                        "size-12 rounded-2xl transition-all duration-300 flex items-center justify-center relative group",
                        color.bg,
                        accentColor === color.value ? "scale-110 shadow-lg ring-4 " + color.ring : "hover:scale-105 opacity-80 hover:opacity-100"
                      )}
                    >
                      {accentColor === color.value && (
                        <motion.div layoutId="active-color" className="absolute -inset-1.5 rounded-[20px] border-2 border-primary" />
                      )}
                      {accentColor === color.value && <div className="size-2.5 rounded-full bg-white shadow-xl" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">System Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'light' }))}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group",
                      theme === 'light' 
                        ? "border-primary bg-primary/5" 
                        : "border-border bg-white hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center transition-colors",
                      theme === 'light' ? "bg-primary text-white" : "bg-white dark:bg-slate-800 text-slate-400 group-hover:text-primary"
                    )}>
                      <Globe className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-primary leading-none">Light Mode</span>
                      <span className="text-[10px] font-bold text-text-secondary mt-1">Clean & Professional</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, theme: 'dark' }))}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group",
                      theme === 'dark' 
                        ? "border-primary bg-primary/5" 
                        : "border-border bg-white hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center transition-colors",
                      theme === 'dark' ? "bg-primary text-white" : "bg-white dark:bg-slate-800 text-slate-400 group-hover:text-primary"
                    )}>
                      <Lock className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-primary leading-none">Dark Mode</span>
                      <span className="text-[10px] font-bold text-text-secondary mt-1">Easy on the eyes</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-text-primary">Notifications</h3>
              <div className="size-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Bell className="size-4" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {notificationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400">
                      <item.icon className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-primary">{item.label}</span>
                      <span className="text-xs font-bold text-text-secondary">{item.desc}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleNotificationToggle(item.id as keyof typeof notifications)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors duration-300",
                      notifications[item.id as keyof typeof notifications] ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "size-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                      notifications[item.id as keyof typeof notifications] ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col gap-6">
            <h3 className="text-lg font-black text-text-primary">Security & Access</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border group hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-text-primary">Two-Factor Authentication</span>
                    <span className="text-xs font-bold text-text-secondary">Extra layer of security for your account</span>
                  </div>
                </div>
                <button 
                  onClick={handleToggleTwoFactor}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                    isTwoFactorEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "size-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                    isTwoFactorEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              <div 
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center justify-between p-4 rounded-2xl bg-white border border-border group hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Lock className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-text-primary">Change Password</span>
                    <span className="text-xs font-bold text-text-secondary">Update your login credentials</span>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface rounded-3xl border border-border p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-text-primary">Recent Activity</h3>
              <div className="size-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {activityLog.map((log, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", log.bg, log.color)}>
                    <log.icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{log.action}</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <span>{log.date}</span>
                      <span>*</span>
                      <span>{log.device}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface-light rounded-2xl border border-border-light shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-light flex items-center justify-between bg-background-light/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Lock className="size-5" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary-light">Change Password</h2>
                </div>
                <button 
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="p-2 text-text-secondary-light hover:text-text-primary-light hover:bg-background-light rounded-lg transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Current Password</label>
                    <input 
                      type="password"
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">New Password</label>
                    <input 
                      type="password"
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary-light">Confirm New Password</label>
                    <input 
                      type="password"
                      className="w-full rounded-xl border border-border-light bg-background-light px-4 py-3 text-sm text-text-primary-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all" 
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-surface-dark text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-primary/20"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
