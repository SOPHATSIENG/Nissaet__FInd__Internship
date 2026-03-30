import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

interface ProfileSettings {
  accentColor: string;
  theme: 'light' | 'dark';
  username: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  role: string;
  avatar?: string;
  coverImage?: string;
}

interface ProfileContextType {
  settings: ProfileSettings;
  updateSettings: (newSettings: Partial<ProfileSettings>) => void;
}

export const defaultSettings: ProfileSettings = {
  accentColor: 'blue',
  theme: 'light',
  username: 'sophea.admin',
  name: 'Sophea Chan',
  email: 'sophea.chan@example.com',
  phone: '+855 12 345 678',
  location: 'Phnom Penh, Cambodia',
  bio: 'Senior Platform Administrator with 5+ years of experience in managing digital ecosystems and user verification workflows.',
  role: 'Super Admin',
  coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2000',
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ProfileSettings>(() => {
    const saved = localStorage.getItem('profile_settings');
    // Merge saved settings with default settings to ensure new fields (like username, coverImage) are present
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('profile_settings', JSON.stringify(settings));
    
    // Apply theme to document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply accent color as CSS variable
    const colorMap: Record<string, string> = {
      emerald: '#10b981',
      blue: '#137fec',
      indigo: '#6366f1',
      violet: '#8b5cf6',
      rose: '#f43f5e',
      amber: '#f59e0b',
    };
    document.documentElement.style.setProperty('--accent', colorMap[settings.accentColor] || colorMap.emerald);
  }, [settings]);

  useEffect(() => {
    let mounted = true;

    const formatRole = (value?: string) => {
      if (!value) return '';
      const normalized = String(value).toLowerCase();
      if (normalized === 'admin') return 'Admin';
      if (normalized === 'super_admin' || normalized === 'super admin') return 'Super Admin';
      return normalized.replace(/(^|\s|_)\w/g, (match) => match.replace('_', ' ').toUpperCase());
    };

    const fallbackFromUser = (previous: ProfileSettings) => ({
      ...previous,
      username: previous.username || user?.username || user?.email?.split('@')[0] || previous.email.split('@')[0],
      name: user?.full_name || user?.name || previous.name,
      email: user?.email || previous.email,
      phone: user?.phone || previous.phone,
      location: user?.location || previous.location,
      bio: user?.bio || previous.bio,
      role: formatRole(user?.role) || previous.role,
      avatar: user?.profile_image || previous.avatar,
    });

    const loadProfile = async () => {
      if (!user) return;
      try {
        const response = await api.getProfileSettings();
        const payload = response?.settings || response || {};
        const personal = payload.personal || {};
        if (!mounted) return;
        setSettings((prev) => ({
          ...prev,
          username: personal.username || prev.username || user?.username || user?.email?.split('@')[0] || prev.email.split('@')[0],
          name: personal.full_name || user?.full_name || user?.name || prev.name,
          email: personal.email || user?.email || prev.email,
          phone: personal.phone || user?.phone || prev.phone,
          location: personal.address || user?.location || prev.location,
          bio: personal.bio || user?.bio || prev.bio,
          role: personal.role || formatRole(user?.role) || prev.role,
          avatar: personal.profile_image || user?.profile_image || prev.avatar,
          coverImage: personal.cover_image || prev.coverImage,
        }));
      } catch (error) {
        if (!mounted) return;
        setSettings((prev) => fallbackFromUser(prev));
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  const updateSettings = (newSettings: Partial<ProfileSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ProfileContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
