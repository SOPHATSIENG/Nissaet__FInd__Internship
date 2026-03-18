export type TabType =
  | 'personal'
  | 'education'
  | 'skills'
  | 'security'
  | 'notifications'
  | 'saved'
  | 'applications';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type NotificationFrequency = 'Instant' | 'Daily' | 'Weekly';

export interface ProfilePersonalSettings {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  bio: string;
  profile_image: string;
  role: string;
}

export interface ProfileEducationSettings {
  education: string;
  university: string;
  major: string;
  graduation_year: number | string;
  gpa: number | string;
  resume_url: string;
  linkedin_url: string;
  portfolio_url: string;
  is_available: boolean;
}

export interface ProfileSkill {
  id?: number;
  name: string;
  category?: string;
  proficiency: SkillLevel;
  years_experience?: number;
  is_primary?: boolean;
}

export interface ProfileSecuritySettings {
  two_factor_enabled: boolean;
}

export interface ProfileNotificationSettings {
  internship_matches_email: boolean;
  internship_matches_in_app: boolean;
  application_status_email: boolean;
  application_status_in_app: boolean;
  career_tips_email: boolean;
  career_tips_in_app: boolean;
  frequency: NotificationFrequency;
}

export interface ProfileSettingsPayload {
  personal: ProfilePersonalSettings;
  education: ProfileEducationSettings;
  skills: ProfileSkill[];
  notifications: ProfileNotificationSettings;
  security: ProfileSecuritySettings;
}
