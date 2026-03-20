import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Mail, 
  Lock, 
  Eye, 
  Save,
  ChevronRight,
  Smartphone,
  Key,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../api/axios';

const settingsSections = [
  { id: 'general', label: 'General Settings', icon: Globe, desc: 'Platform language, timezone, and regional defaults.' },
  { id: 'security', label: 'Security & Auth', icon: Shield, desc: 'Login methods, password policies, and 2FA settings.' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and push notification triggers for users.' },
  { id: 'database', label: 'Data Management', icon: Database, desc: 'Backup schedules, data retention, and export tools.' },
];

const defaultSettings = {
  platformName: 'Internship Cambodia',
  supportEmail: 'support@internship.kh',
  seoDescription: 'The leading platform for finding internships and early career opportunities in Cambodia.',
  maintenanceMode: false,
  defaultLanguage: 'English (US)',
  timezone: '(GMT+07:00) Phnom Penh',
  brandLogo: null as string | null,
  brandFavicon: null as string | null,
  authMethods: {
    'Email & Password': true,
    'Google OAuth': true,
    'Microsoft Azure AD': false,
  },
  bruteForceProtection: true,
  ipWhitelist: ['192.168.1.1', '10.0.0.45'] as string[],
  passwordMinLength: 8,
  sessionTimeoutMinutes: 60,
  emailTriggers: {
    'New User Registration': true,
    'Company Verification Request': true,
    'System Error Alerts': true,
    'Weekly Analytics Summary': false,
  },
  slackWebhookUrl: '',
  pushNotifications: true,
  storage: {
    totalGb: 100,
    usedGb: 42.8,
    databaseGb: 12.4,
    mediaGb: 28.2,
    logsGb: 2.2,
  },
  lastBackupAt: null as string | null,
  backupSchedule: 'Daily at 04:00 AM',
  dataRetentionDays: 90,
};

export const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [settings, setSettings] = useState(defaultSettings);

  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const faviconInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          brandLogo: type === 'logo' ? (reader.result as string) : prev.brandLogo,
          brandFavicon: type === 'favicon' ? (reader.result as string) : prev.brandFavicon,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggle = (category: 'maintenanceMode' | 'bruteForceProtection' | 'pushNotifications') => {
    setSettings(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAuthMethodToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      authMethods: { ...prev.authMethods, [key]: !prev.authMethods[key as keyof typeof prev.authMethods] },
    }));
  };

  const handleEmailTriggerToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      emailTriggers: { ...prev.emailTriggers, [key]: !prev.emailTriggers[key as keyof typeof prev.emailTriggers] },
    }));
  };

  const handleAddIp = () => {
    const nextIp = window.prompt('Enter IP address');
    if (!nextIp) return;
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.includes(nextIp) ? prev.ipWhitelist : [...prev.ipWhitelist, nextIp],
    }));
  };

  const handleRemoveIp = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(item => item !== ip),
    }));
  };

  // New states for Export and Purge
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<{ type: 'export' | 'purge', message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await api.adminGetSettings();
        const payload = response?.settings || response || {};
        if (!isMounted) return;
        setSettings({
          ...defaultSettings,
          ...payload,
          authMethods: { ...defaultSettings.authMethods, ...(payload.authMethods || {}) },
          emailTriggers: { ...defaultSettings.emailTriggers, ...(payload.emailTriggers || {}) },
          storage: { ...defaultSettings.storage, ...(payload.storage || {}) },
          ipWhitelist: Array.isArray(payload.ipWhitelist) ? payload.ipWhitelist : defaultSettings.ipWhitelist,
        });
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setLoadError('Failed to load admin settings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setShowSuccess(false);
      await api.adminUpdateSettings(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      setLoadError('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setShowExportModal(false);
      const response = await api.adminExportData();
      setSettings(prev => ({
        ...prev,
        lastBackupAt: response?.lastBackupAt || new Date().toISOString(),
      }));
      setActionSuccess({ type: 'export', message: 'System data exported successfully!' });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (error) {
      console.error(error);
      setActionSuccess({ type: 'export', message: 'Failed to export system data.' });
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurge = async () => {
    try {
      setIsPurging(true);
      setShowPurgeModal(false);
      const response = await api.adminPurgeLogs();
      setSettings(prev => ({
        ...prev,
        storage: {
          ...prev.storage,
          logsGb: response?.storageLogsGb ?? 0,
          usedGb: response?.storageUsedGb ?? prev.storage.usedGb,
        }
      }));
      setActionSuccess({ type: 'purge', message: 'System logs have been purged.' });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (error) {
      console.error(error);
      setActionSuccess({ type: 'purge', message: 'Failed to purge system logs.' });
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsPurging(false);
    }
  };

  const storageUsedGb = settings.storage.usedGb || (settings.storage.databaseGb + settings.storage.mediaGb + settings.storage.logsGb);
  const storageTotalGb = settings.storage.totalGb || 0;
  const storagePercent = storageTotalGb > 0 ? Math.min(100, (storageUsedGb / storageTotalGb) * 100) : 0;
  const lastBackupLabel = settings.lastBackupAt
    ? new Date(settings.lastBackupAt).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  const renderSectionContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16 text-sm font-bold text-text-secondary-light">
          Loading settings...
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex items-center justify-center py-16 text-sm font-bold text-rose-600">
          {loadError}
        </div>
      );
    }

    switch (activeSection) {
      case 'general':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 py-4"
          >
            <div className="flex flex-col gap-6">
              <label className="text-sm font-semibold text-text-primary-light">Brand Identity</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-background-light">
                  <input 
                    type="file" 
                    ref={logoInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="size-16 rounded-lg border-2 border-dashed border-border-light flex flex-col items-center justify-center text-text-secondary-light hover:border-primary/50 cursor-pointer transition-all overflow-hidden relative group"
                  >
                    {settings.brandLogo ? (
                      <>
                        <img src={settings.brandLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Save className="size-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Save className="size-5 mb-1" />
                        <span className="text-[10px] font-bold">Logo</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-text-primary-light">Platform Logo</span>
                    <span className="text-xs text-text-secondary-light">PNG, SVG up to 2MB.</span>
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs font-bold text-primary mt-1 text-left hover:underline"
                    >
                      {settings.brandLogo ? 'Change Logo' : 'Upload New'}
                    </button>
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-background-light">
                  <input 
                    type="file" 
                    ref={faviconInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'favicon')}
                  />
                  <div 
                    onClick={() => faviconInputRef.current?.click()}
                    className="size-16 rounded-lg border-2 border-dashed border-border-light flex flex-col items-center justify-center text-text-secondary-light hover:border-primary/50 cursor-pointer transition-all overflow-hidden relative group"
                  >
                    {settings.brandFavicon ? (
                      <>
                        <img src={settings.brandFavicon} alt="Favicon" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="size-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Eye className="size-5 mb-1" />
                        <span className="text-[10px] font-bold">Icon</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-text-primary-light">Favicon</span>
                    <span className="text-xs text-text-secondary-light">ICO, PNG (32x32px).</span>
                    <button 
                      onClick={() => faviconInputRef.current?.click()}
                      className="text-xs font-bold text-primary mt-1 text-left hover:underline"
                    >
                      {settings.brandFavicon ? 'Change Icon' : 'Upload New'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary-light">Platform Name</label>
                <input 
                  className="w-full rounded-lg border border-border-light bg-background-light px-4 py-2.5 text-sm text-text-primary-light focus:border-primary outline-none transition-all" 
                  value={settings.platformName}
                  onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary-light">Support Email</label>
                <input 
                  className="w-full rounded-lg border border-border-light bg-background-light px-4 py-2.5 text-sm text-text-primary-light focus:border-primary outline-none transition-all" 
                  value={settings.supportEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  type="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary-light">SEO Meta Description</label>
              <textarea 
                className="w-full rounded-lg border border-border-light bg-background-light px-4 py-2.5 text-sm text-text-primary-light focus:border-primary outline-none transition-all min-h-[100px] resize-none"
                value={settings.seoDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
              />
              <span className="text-[10px] text-text-secondary-light text-right">{settings.seoDescription.length} / 160 characters</span>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Maintenance Mode</label>
              <div className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-border-light">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary-light">Enable Maintenance</span>
                  <span className="text-xs text-text-secondary-light">Restrict user access while performing updates.</span>
                </div>
                <button 
                  onClick={() => handleToggle('maintenanceMode')}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    settings.maintenanceMode ? "bg-primary" : "bg-border-light"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.maintenanceMode ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Regional Settings</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-secondary-light">Default Language</span>
                  <select
                    className="w-full rounded-lg border border-border-light bg-background-light px-3 py-2 text-sm text-text-primary-light outline-none focus:border-primary transition-all"
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Khmer (Cambodia)">Khmer (Cambodia)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-secondary-light">Timezone</span>
                  <select
                    className="w-full rounded-lg border border-border-light bg-background-light px-3 py-2 text-sm text-text-primary-light outline-none focus:border-primary transition-all"
                    value={settings.timezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="(GMT+07:00) Phnom Penh">(GMT+07:00) Phnom Penh</option>
                    <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 py-4"
          >
            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Authentication Methods</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Email & Password', icon: Mail },
                  { label: 'Google OAuth', icon: Globe },
                  { label: 'Microsoft Azure AD', icon: Shield },
                ].map((method) => (
                  <div key={method.label} className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-border-light">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-surface-light border border-border-light flex items-center justify-center text-text-secondary-light">
                        <method.icon className="size-4" />
                      </div>
                      <span className="text-sm font-bold text-text-primary-light">{method.label}</span>
                    </div>
                    <button 
                      onClick={() => handleAuthMethodToggle(method.label)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        settings.authMethods[method.label as keyof typeof settings.authMethods] ? "bg-primary" : "bg-border-light"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        settings.authMethods[method.label as keyof typeof settings.authMethods] ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Advanced Security</label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-border-light">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary-light">Brute Force Protection</span>
                    <span className="text-xs text-text-secondary-light">Lock account after 5 failed login attempts.</span>
                  </div>
                  <button 
                    onClick={() => handleToggle('bruteForceProtection')}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      settings.bruteForceProtection ? "bg-primary" : "bg-border-light"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      settings.bruteForceProtection ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-background-light border border-border-light">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary-light">IP Whitelisting</span>
                      <span className="text-xs text-text-secondary-light">Only allow admin access from specific IP addresses.</span>
                    </div>
                    <button className="text-xs font-bold text-primary" onClick={handleAddIp}>Add IP</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settings.ipWhitelist.map((ip) => (
                      <span key={ip} className="px-2 py-1 rounded bg-surface-light border border-border-light text-[10px] font-mono text-text-secondary-light flex items-center gap-2">
                        {ip}
                        <button
                          onClick={() => handleRemoveIp(ip)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700"
                          aria-label={`Remove ${ip}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Password Policy</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-secondary-light">Minimum Length</span>
                  <input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: Number(e.target.value || 0) }))}
                    className="w-full rounded-lg border border-border-light bg-background-light px-3 py-2 text-sm text-text-primary-light outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-secondary-light">Session Timeout (Minutes)</span>
                  <input
                    type="number"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value || 0) }))}
                    className="w-full rounded-lg border border-border-light bg-background-light px-3 py-2 text-sm text-text-primary-light outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
              <AlertCircle className="size-5 text-amber-600 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-amber-900">Security Recommendation</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Enabling Two-Factor Authentication (2FA) for all administrative accounts is highly recommended to prevent unauthorized access.
                </p>
              </div>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 py-4"
          >
            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Email Triggers</label>
              <div className="flex flex-col gap-2">
                {[
                  'New User Registration',
                  'Company Verification Request',
                  'System Error Alerts',
                  'Weekly Analytics Summary'
                ].map((trigger) => (
                  <div key={trigger} className="flex items-center justify-between p-3 rounded-lg hover:bg-background-light transition-colors">
                    <span className="text-sm text-text-secondary-light">{trigger}</span>
                    <button 
                      onClick={() => handleEmailTriggerToggle(trigger)}
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                        settings.emailTriggers[trigger as keyof typeof settings.emailTriggers] ? "bg-primary" : "bg-border-light"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                        settings.emailTriggers[trigger as keyof typeof settings.emailTriggers] ? "translate-x-5" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Integrations</label>
              <div className="p-4 rounded-xl bg-background-light border border-border-light flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-[#4A154B] flex items-center justify-center text-white">
                      <Smartphone className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary-light">Slack Integration</span>
                      <span className="text-xs text-text-secondary-light">Send system alerts to a Slack channel.</span>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-primary">Configure</button>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-text-secondary-light uppercase tracking-wider">Webhook URL</span>
                  <input 
                    type="password" 
                    value={settings.slackWebhookUrl}
                    onChange={(e) => setSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                    className="w-full rounded-lg border border-border-light bg-surface-light px-3 py-2 text-xs font-mono text-text-secondary-light outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Push Notifications</label>
              <div className="p-4 rounded-xl bg-background-light border border-border-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-5 text-text-secondary-light" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary-light">Browser Push</span>
                    <span className="text-xs text-text-secondary-light">Send real-time alerts to admin browsers.</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle('pushNotifications')}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    settings.pushNotifications ? "bg-primary" : "bg-border-light"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    settings.pushNotifications ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'database':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 py-4"
          >
            <div className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-text-primary-light">Storage Usage</label>
              <div className="p-5 rounded-xl border border-border-light bg-background-light flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary-light">Total Storage</span>
                    <span className="text-xs text-text-secondary-light">{storageUsedGb.toFixed(1)} GB of {storageTotalGb.toFixed(1)} GB used</span>
                  </div>
                  <span className="text-sm font-black text-primary">{storagePercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${storagePercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-secondary-light uppercase">Database</span>
                    <span className="text-xs font-bold text-text-primary-light">{settings.storage.databaseGb.toFixed(1)} GB</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-secondary-light uppercase">Media</span>
                    <span className="text-xs font-bold text-text-primary-light">{settings.storage.mediaGb.toFixed(1)} GB</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-secondary-light uppercase">Logs</span>
                    <span className="text-xs font-bold text-text-primary-light">{settings.storage.logsGb.toFixed(1)} GB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border-light bg-background-light flex flex-col gap-3">
                <div className="flex items-center gap-2 text-primary">
                  <RefreshCw className="size-4" />
                  <span className="text-sm font-bold">Auto Backups</span>
                </div>
                <p className="text-xs text-text-secondary-light">Last backup: {lastBackupLabel}</p>
                <select
                  className="mt-2 w-full rounded-lg border border-border-light bg-surface-light px-3 py-2 text-sm outline-none"
                  value={settings.backupSchedule}
                  onChange={(e) => setSettings(prev => ({ ...prev, backupSchedule: e.target.value }))}
                >
                  <option value="Daily at 04:00 AM">Daily at 04:00 AM</option>
                  <option value="Weekly on Sundays">Weekly on Sundays</option>
                  <option value="Manual Only">Manual Only</option>
                </select>
              </div>
              <div className="p-4 rounded-xl border border-border-light bg-background-light flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-500">
                  <Clock className="size-4" />
                  <span className="text-sm font-bold">Data Retention</span>
                </div>
                <p className="text-xs text-text-secondary-light">Logs and activity history storage.</p>
                <select
                  className="mt-2 w-full rounded-lg border border-border-light bg-surface-light px-3 py-2 text-sm outline-none"
                  value={settings.dataRetentionDays === 0 ? 'Forever' : String(settings.dataRetentionDays)}
                  onChange={(e) => {
                    const value = e.target.value === 'Forever' ? 0 : Number(e.target.value);
                    setSettings(prev => ({ ...prev, dataRetentionDays: value }));
                  }}
                >
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">1 Year</option>
                  <option value="Forever">Forever</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-text-primary-light">Maintenance Actions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowExportModal(true)}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border-light bg-surface-light hover:bg-background-light transition-colors text-sm font-bold text-text-primary-light disabled:opacity-50"
                >
                  {isExporting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export All Data'}
                </button>
                <button 
                  onClick={() => setShowPurgeModal(true)}
                  disabled={isPurging}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-sm font-bold text-red-600 disabled:opacity-50"
                >
                  {isPurging ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {isPurging ? 'Purging...' : 'Purge System Logs'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {actionSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "p-4 rounded-xl border flex items-center gap-3",
                    actionSuccess.type === 'export' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                  )}
                >
                  <Check className="size-5" />
                  <span className="text-sm font-bold">{actionSuccess.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 overflow-y-auto no-scrollbar max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-text-primary-light tracking-tight">System Settings</h1>
        <p className="text-text-secondary-light text-base">Configure global platform parameters and security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-3">
          {settingsSections.map((section) => (
            <button 
              key={section.id} 
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                activeSection === section.id
                  ? "bg-blue-50 border-blue-300 shadow-sm"
                  : "bg-gray-100 border-gray-200 hover:border-blue-300 hover:bg-gray-200"
              )}
            >
              <div className={cn(
                "size-10 rounded-lg flex items-center justify-center transition-colors",
                activeSection === section.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500 group-hover:text-blue-600"
              )}>
                <section.icon className="size-5" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className={cn("text-sm font-bold truncate", activeSection === section.id ? "text-text-primary-light" : "text-text-secondary-light group-hover:text-text-primary-light")}>
                  {section.label}
                </span>
                <span className="text-[10px] text-text-secondary-light truncate leading-tight">{section.desc}</span>
              </div>
              <ChevronRight className={cn("size-4 shrink-0 transition-transform", activeSection === section.id ? "text-blue-600 translate-x-1" : "text-gray-300")} />
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 bg-surface-light rounded-2xl border border-border-light p-8 shadow-sm min-h-[500px]">
          <div className="flex items-center justify-between border-b border-border-light pb-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-text-primary-light">
                {settingsSections.find(s => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-text-secondary-light mt-1">
                {activeSection === 'general' && 'Basic platform identity and localization.'}
                {activeSection === 'security' && 'Manage authentication and access control.'}
                {activeSection === 'notifications' && 'Configure automated system communications.'}
                {activeSection === 'database' && 'System maintenance and data lifecycle.'}
              </p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm min-w-[140px] justify-center",
                showSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              )}
            >
              {isSaving ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : showSuccess ? (
                <>
                  <Check className="size-4" /> Saved!
                </>
              ) : (
                <>
                  <Save className="size-4" /> Save Changes
                </>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {renderSectionContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* Export Confirmation Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-light rounded-2xl border border-border-light p-6 shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-3 text-primary mb-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-text-primary-light">Export All Data</h3>
              </div>
              <p className="text-sm text-text-secondary-light leading-relaxed mb-6">
                This will generate a comprehensive backup of all system data, including users, companies, categories, and logs. The process may take a few minutes depending on the data size.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-surface-dark text-sm font-bold hover:bg-emerald-400 transition-colors"
                >
                  Start Export
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purge Confirmation Modal */}
      <AnimatePresence>
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-light rounded-2xl border border-border-light p-6 shadow-2xl max-w-md w-full"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-text-primary-light">Purge System Logs</h3>
              </div>
              <p className="text-sm text-text-secondary-light leading-relaxed mb-6">
                Are you sure you want to purge all system logs? This action is <span className="font-bold text-red-600 uppercase">irreversible</span> and will permanently delete all activity history and error reports.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPurgeModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border-light text-sm font-bold text-text-secondary-light hover:bg-background-light transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePurge}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
