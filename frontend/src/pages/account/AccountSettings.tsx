import {useEffect, useMemo, useState, type ReactElement} from 'react';
import api from '../../api/axios';
import {type ProfileSettingsPayload, type TabType} from '../../components/settings/types';
import {SettingsSidebar} from '../../components/settings/layout/SettingsSidebar';
import {
  EducationTab,
  NotificationsTab,
  PersonalTab,
  SecurityTab,
  SkillsTab,
} from '../../components/settings/tabs';

const TAB_DESCRIPTION: Record<TabType, string> = {
  personal: 'Update your profile details and student bio.',
  education: 'Manage your education history and CV for internship applications.',
  skills: 'Add and update skills to improve internship matching.',
  security: 'Manage password, account connections, and login sessions.',
  notifications: 'Control which alerts and updates you receive.',
};

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

export default function AccountSettings() {
  // FIX MARK: all settings tabs now load from API + DB and save dynamically.
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [settings, setSettings] = useState<ProfileSettingsPayload>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.getProfileSettings();
        if (response?.settings) {
          setSettings((previous) => ({...previous, ...response.settings}));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const tabContent = useMemo<Record<TabType, ReactElement>>(
    () => ({
      personal: <PersonalTab data={settings.personal} onSaved={setSettings} />,
      education: <EducationTab data={settings.education} onSaved={setSettings} />,
      skills: <SkillsTab data={settings.skills} onSaved={setSettings} />,
      security: <SecurityTab data={settings.security} onSaved={setSettings} />,
      notifications: <NotificationsTab data={settings.notifications} onSaved={setSettings} />,
    }),
    [settings]
  );

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* FIX MARK: changed heading to Student Settings as requested. */}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Settings</h1>
          <p className="text-slate-500 mt-2">{TAB_DESCRIPTION[activeTab]}</p>
        </div>

        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

        {loading ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm text-slate-500">
            Loading settings...
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1">{tabContent[activeTab]}</div>
          </div>
        )}
      </div>
    </section>
  );
}
