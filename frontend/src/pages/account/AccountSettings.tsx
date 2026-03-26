import {useEffect, useMemo, useState, type ReactElement} from 'react';
import {useSearchParams} from 'react-router-dom';
import api from '../../api/axios';
import {type ProfileSettingsPayload, type TabType} from '../../components/settings/types';
import {SettingsSidebar} from '../../components/settings/layout/SettingsSidebar';
import {
  EducationTab,
  NotificationsTab,
  PersonalTab,
  SecurityTab,
  SkillsTab,
  SavedTab,
  ApplicationsTab,
} from '../../components/settings/tabs';

const TAB_DESCRIPTION: Record<TabType, string> = {
  personal: 'Update your profile details and student bio.',
  education: 'Manage your education history and CV for internship applications.',
  skills: 'Add and update skills to improve internship matching.',
  security: 'Manage password, account connections, and login sessions.',
  notifications: 'Control which alerts and updates you receive.',
  saved: 'Review internships you have bookmarked for later.',
  applications: 'Track your submitted internship applications and statuses.',
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
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<ProfileSettingsPayload>(EMPTY_SETTINGS);
  const [savedInternships, setSavedInternships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
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

        const savedResponse = await api.getSavedInternships();
        if (savedResponse?.internships) {
          setSavedInternships(savedResponse.internships);
        }

        const applicationsResponse = await api.getMyApplications({ limit: 100 });
        if (applicationsResponse?.applications) {
          setApplications(applicationsResponse.applications);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const rawTab = searchParams.get('tab');
    if (!rawTab) return;
    const tab = rawTab.toLowerCase() as TabType;
    if (TAB_DESCRIPTION[tab]) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabContent = useMemo<Record<TabType, ReactElement>>(
    () => ({
      personal: <PersonalTab data={settings.personal} onSaved={setSettings} isAvailable={settings.education?.is_available} />,
      education: <EducationTab data={settings.education} onSaved={setSettings} />,
      skills: <SkillsTab data={settings.skills} onSaved={setSettings} />,
      security: <SecurityTab data={settings.security} onSaved={setSettings} />,
      notifications: <NotificationsTab data={settings.notifications} onSaved={setSettings} />,
      saved: <SavedTab savedInternships={savedInternships} onUnsaved={async (internshipId) => {
        try {
          await api.unsaveInternship(internshipId);
          const res = await api.getSavedInternships();
          if (res?.internships) setSavedInternships(res.internships);
        } catch (error) {
          console.error('Failed to unsave internship:', error);
        }
      }} />,
      applications: <ApplicationsTab applications={applications} />,
    }),
    [settings, savedInternships, applications]
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
