
import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Camera,
  Save,
  Lock,
  Bell,
  CreditCard,
  User,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Settings() {
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    industry: 'Technology',
    website: '',
    description: '',
    location: '',
    logo: ''
  });

  useEffect(() => {
    const companyProfile = (user && user.company_profile) || null;
    const displayName = companyProfile?.company_name || companyProfile?.name || user?.company_name || user?.full_name || user?.name || '';

    setFormData({
      displayName,
      industry: companyProfile?.industry || user?.industry || 'Technology',
      website: companyProfile?.website || user?.website || '',
      description: companyProfile?.description || user?.bio || '',
      location: companyProfile?.location || user?.location || '',
      logo: companyProfile?.logo || ''
    });
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        setError('Image size must be less than 800KB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const isValidUrl = (value: string) => {
    const normalized = String(value || '').trim();
    if (!normalized) return true;
    try {
      const url = new URL(normalized);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validate = () => {
    if (!user) return 'Authentication required.';
    if (user.role !== 'company') return 'This account is not a company account.';
    if (!formData.displayName.trim()) return 'Company name is required.';
    if (!isValidUrl(formData.website)) return 'Website URL must be a valid http(s) URL.';
    return '';
  };

  const handleSave = async () => {
    if (!user) return;
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.updateCompanySettings({
        company_name: formData.displayName,
        industry: formData.industry,
        website: formData.website.trim() || null,
        description: formData.description,
        location: formData.location,
        logo: formData.logo || null
      });

      if (res?.company_profile) {
        updateUser({ 
          company_profile: res.company_profile,
          profile_image: res.company_profile.logo
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your company profile and account preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {[
              { name: 'Profile Settings', icon: User, path: '/company/settings' },
              { name: 'Security & Login', icon: Lock, path: '/company/security' },
              { name: 'Notifications', icon: Bell, path: '/company/notifications' },
              { name: 'Billing', icon: CreditCard, path: '/company/billing' },
            ].map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              <p className="text-sm text-slate-500 mt-1">This information will be displayed publicly to students.</p>
            </div>
            <div className="p-6 space-y-8">
              {error ? (
                <p className="text-sm text-red-600 bg-blue-50 border border-red-100 px-3 py-2 rounded-lg">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 overflow-hidden">
                    {formData.logo ? (
                      <img className="h-full w-full object-cover" src={formData.logo} alt="Profile" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-primary transition-all"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Profile Picture</h4>
                  <p className="text-xs text-slate-500 mt-1">JPG, GIF or PNG. Max size of 800K</p>
                  <div className="flex gap-3 mt-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Upload New
                    </button>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Display Name</label>
                  <input 
                    className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-2.5" 
                    type="text" 
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Account Type</label>
                  <input
                    className="w-full rounded-lg border-slate-200 py-2.5 bg-slate-50"
                    type="text"
                    value={user?.role || ''}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Industry</label>
                  <select 
                    className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-2.5"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  >
                    <option>Banking & Finance</option>
                    <option>Technology</option>
                    <option>Education</option>
                    <option>Healthcare</option>
                    <option>E-commerce</option>
                    <option>Creative & Design</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Website URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Globe size={18} />
                    </div>
                    <input 
                      className="w-full rounded-lg border-slate-200 pl-10 focus:ring-primary focus:border-primary py-2.5" 
                      type="url" 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <input 
                      className="w-full rounded-lg border-slate-200 pl-10 focus:ring-primary focus:border-primary py-2.5" 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Phnom Penh, Cambodia"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900">Contact Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      className="w-full rounded-lg border-slate-200 pl-10 focus:ring-primary focus:border-primary py-2.5 bg-slate-50" 
                      type="email" 
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">
                  Company Description
                </label>
                <textarea 
                  className="w-full rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-2.5 min-h-[120px]" 
                  placeholder="Tell students about your company culture and mission..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end items-center gap-4">
                {success && (
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-blue-600 text-sm font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 size={16} />
                    Profile updated successfully!
                  </motion.span>
                )}
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
