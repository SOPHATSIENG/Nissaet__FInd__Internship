import {Bell, GraduationCap, Settings, Shield, User} from 'lucide-react';
import {type TabType} from '../types';
import {SidebarItem} from '../shared/SidebarItem';

interface SettingsSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const SIDEBAR_ITEMS: Array<{tab: TabType; label: string; icon: typeof User}> = [
  {tab: 'personal', label: 'Personal Info', icon: User},
  {tab: 'education', label: 'Education', icon: GraduationCap},
  {tab: 'skills', label: 'Skills', icon: Settings},
  {tab: 'security', label: 'Security', icon: Shield},
  {tab: 'notifications', label: 'Notifications', icon: Bell},
];

export function SettingsSidebar({activeTab, onTabChange}: SettingsSidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-1">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarItem
            key={item.tab}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.tab}
            onClick={() => onTabChange(item.tab)}
          />
        ))}
      </div>
    </aside>
  );
}
