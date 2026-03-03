import {useState, type ReactElement} from 'react';
import {type TabType} from '../../components/settings/types';
import {SettingsSidebar} from '../../components/settings/layout/SettingsSidebar';
import {
  EducationTab,
  NotificationsTab,
  PersonalTab,
  SecurityTab,
  SkillsTab,
} from '../../components/settings/tabs';

const TAB_CONTENT: Record<TabType, ReactElement> = {
  personal: <PersonalTab />,
  education: <EducationTab />,
  skills: <SkillsTab />,
  security: <SecurityTab />,
  notifications: <NotificationsTab />,
};

const TAB_DESCRIPTION: Record<TabType, string> = {
  personal: 'Update your profile details and student bio.',
  education: 'Manage your education history and CV for internship applications.',
  skills: 'Add and update skills to improve internship matching.',
  security: 'Manage password, account connections, and login sessions.',
  notifications: 'Control which alerts and updates you receive.',
};

export default function AccountSettings() {
  // FIX MARK: student settings opens on Personal Info tab by default.
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* FIX MARK: changed heading to Student Settings as requested. */}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Settings</h1>
          <p className="text-slate-500 mt-2">{TAB_DESCRIPTION[activeTab]}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1">{TAB_CONTENT[activeTab]}</div>
        </div>
      </div>
    </section>
  );
}
