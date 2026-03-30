import {Camera} from 'lucide-react';
import {motion} from 'motion/react';
import {type ChangeEvent, useEffect, useMemo, useRef, useState} from 'react';
import api from '../../../api/axios';
import {useAuth} from '../../../context/AuthContext';
import {type ProfilePersonalSettings, type ProfileSettingsPayload} from '../types';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';

interface PersonalTabProps {
  data: ProfilePersonalSettings;
  onSaved: (settings: ProfileSettingsPayload) => void;
  isAvailable?: boolean;
}

const EMPTY_PERSONAL: ProfilePersonalSettings = {
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
};

const splitFullName = (fullName: string) => {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {firstName: '', lastName: ''};
  if (tokens.length === 1) return {firstName: tokens[0], lastName: ''};
  return {firstName: tokens[0], lastName: tokens.slice(1).join(' ')};
};

export function PersonalTab({data, onSaved, isAvailable}: PersonalTabProps) {
  // FIX MARK: personal tab now reads real values from DB instead of static placeholders.
  const {updateUser} = useAuth();
  const profile = data || EMPTY_PERSONAL;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const nameParts = splitFullName(profile.full_name || '');
    setFirstName(profile.first_name || nameParts.firstName);
    setLastName(profile.last_name || nameParts.lastName);
    setPhone(profile.phone || '');
    setDob(profile.dob || '');
    setAddress(profile.address || '');
    setBio(profile.bio || '');
    setProfileImage(profile.profile_image || '');
    setStatus('');
    setError('');
  }, [profile]);

  const initials = useMemo(() => {
    const joined = `${firstName} ${lastName}`.trim();
    if (!joined) return 'N';
    return joined
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [firstName, lastName]);

  const selectPhoto = () => fileRef.current?.click();

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      setError('Image size must be 800KB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    setError('');
    try {
      if (dob) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
          setError('Date of birth must be a valid date.');
          return;
        }
        const parsed = new Date(`${dob}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
          setError('Date of birth must be a valid date.');
          return;
        }
        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (parsed > todayMidnight) {
          setError('Date of birth cannot be in the future.');
          return;
        }
      }

      const fullName = `${firstName} ${lastName}`.trim();
      const response = await api.updatePersonalSettings({
        full_name: fullName,
        phone,
        dob: dob || null,
        address,
        bio,
        profile_image: profileImage || null,
      });

      if (response?.settings) {
        onSaved(response.settings);
        // FIX MARK: guard session sync so profile save never fails because of optional client handlers.
        if (typeof updateUser === 'function') {
          updateUser({
            full_name: response.settings.personal?.full_name,
            name: response.settings.personal?.full_name,
            profile_image: response.settings.personal?.profile_image,
          });
        }
        // FIX MARK: notify header to refresh avatar immediately after profile image update.
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('profile-settings-updated', {
                detail: response.settings,
              })
            );
          }
        } catch {
          // Event dispatch failure should not block profile save success.
        }
      }

      setStatus('Personal profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save personal profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader
          title="Personal Information"
          description="Profile values are loaded from your database record and saved back instantly."
        />

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <button
                type="button"
                onClick={selectPhoto}
                className={`w-32 h-32 rounded-full bg-slate-900 text-white flex items-center justify-center overflow-hidden border-4 border-white shadow-lg ${isAvailable ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white' : ''}`}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold">{initials}</span>
                )}
                <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </span>
                {isAvailable && (
                  <span
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md"
                    aria-label="Open to work"
                  >
                    Open to work
                  </span>
                )}
              </button>
            </div>

            <button type="button" onClick={selectPhoto} className="text-emerald-600 text-sm font-semibold">
              Change Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={onPhotoChange}
            />
            <p className="text-xs text-slate-400 text-center">Allowed JPG, GIF, PNG, WEBP. Max size 800KB.</p>
          </div>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="First Name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              <InputField label="Last Name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
              <InputField label="Email Address" value={profile.email || ''} disabled />
              <InputField label="Phone Number" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <InputField label="Date of Birth" type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
              <InputField label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600">Bio</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[120px]"
                value={bio}
                maxLength={500}
                onChange={(event) => setBio(event.target.value)}
              />
              <p className="text-right text-xs text-slate-400">{bio.length}/500 characters</p>
            </div>

            {(status || error) && (
              <p className={`text-sm ${error ? 'text-red-600' : 'text-emerald-600'}`}>{error || status}</p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 disabled:opacity-70 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-600/20"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
