import {Bell, Smartphone} from 'lucide-react';
import {motion} from 'motion/react';
import {useEffect, useState} from 'react';
import api from '../../../api/axios';
import {type ProfileNotificationSettings, type ProfileSettingsPayload} from '../types';
import {SectionHeader} from '../shared/SectionHeader';

const NOTIFICATION_SECTIONS = [
  {
    title: 'New Internship Matches',
    desc: 'Get notified when new internships match your profile and skills.',
    emailKey: 'internship_matches_email',
    inAppKey: 'internship_matches_in_app',
    hasFrequency: true,
  },
  {
    title: 'Application Status Changes',
    desc: 'Receive updates when an employer views your application or invites you for an interview.',
    emailKey: 'application_status_email',
    inAppKey: 'application_status_in_app',
    hasFrequency: false,
  },
  {
    title: 'Career Tips & Advice',
    desc: 'Weekly tips on resume writing, interview preparation, and career growth.',
    emailKey: 'career_tips_email',
    inAppKey: 'career_tips_in_app',
    hasFrequency: false,
  },
] as const;

const FREQUENCIES = ['Instant', 'Daily', 'Weekly'] as const;

interface NotificationsTabProps {
  data: ProfileNotificationSettings;
  onSaved: (settings: ProfileSettingsPayload) => void;
}

const EMPTY_NOTIFICATIONS: ProfileNotificationSettings = {
  internship_matches_email: true,
  internship_matches_in_app: true,
  application_status_email: true,
  application_status_in_app: true,
  career_tips_email: false,
  career_tips_in_app: false,
  frequency: 'Daily',
};

type NotificationBooleanKey =
  | 'internship_matches_email'
  | 'internship_matches_in_app'
  | 'application_status_email'
  | 'application_status_in_app'
  | 'career_tips_email'
  | 'career_tips_in_app';

export function NotificationsTab({data, onSaved}: NotificationsTabProps) {
  // FIX MARK: notification preferences are now persisted in DB columns.
  const [form, setForm] = useState<ProfileNotificationSettings>(data || EMPTY_NOTIFICATIONS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(data || EMPTY_NOTIFICATIONS);
    setStatus('');
    setError('');
  }, [data]);

  const toggleValue = (key: NotificationBooleanKey) => {
    setForm((previous) => ({...previous, [key]: !previous[key]}));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const response = await api.updateNotificationSettings(form);
      if (response?.settings) {
        onSaved(response.settings);
      }
      setStatus('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader
          title="Notification Preferences"
          description="Control how and when you receive updates. Values are loaded from DB."
        />

        <div className="space-y-12">
          {NOTIFICATION_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800">{section.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{section.desc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                      <Bell size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Email Notifications</span>
                  </div>
                  <button
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                      form[section.emailKey] ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                    onClick={() => toggleValue(section.emailKey)}
                    type="button"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        form[section.emailKey] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                      <Smartphone size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">In-App Notifications</span>
                  </div>
                  <button
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                      form[section.inAppKey] ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                    onClick={() => toggleValue(section.inAppKey)}
                    type="button"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        form[section.inAppKey] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {section.hasFrequency && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Alert Frequency
                  </p>
                  <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                    {FREQUENCIES.map((frequency) => (
                      <button
                        key={frequency}
                        type="button"
                        onClick={() => setForm((previous) => ({...previous, frequency}))}
                        className={`px-8 py-2 text-sm font-medium rounded-lg transition-all ${
                          frequency === form.frequency
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {frequency}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(status || error) && (
          <p className={`text-sm mt-8 ${error ? 'text-red-600' : 'text-emerald-600'}`}>{error || status}</p>
        )}

        <div className="flex justify-end mt-12">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-500 disabled:opacity-70 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
