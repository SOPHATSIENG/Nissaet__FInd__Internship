import {motion} from 'motion/react';
import {useEffect, useState} from 'react';
import api from '../../../api/axios';
import {type ProfileSecuritySettings, type ProfileSettingsPayload} from '../types';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';

interface SecurityTabProps {
  data: ProfileSecuritySettings;
  onSaved: (settings: ProfileSettingsPayload) => void;
}

const EMPTY_SECURITY: ProfileSecuritySettings = {
  two_factor_enabled: false,
};

export function SecurityTab({data, onSaved}: SecurityTabProps) {
  // FIX MARK: security tab now updates real password and 2FA DB fields.
  const securityData = data || EMPTY_SECURITY;
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [saving2FA, setSaving2FA] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setTwoFactorEnabled(!!securityData.two_factor_enabled);
  }, [securityData]);

  const handleUpdatePassword = async () => {
    setStatus('');
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.updatePassword({
        currentPassword,
        newPassword,
      });
      setStatus('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setStatus('');
    setError('');
    setSaving2FA(true);
    try {
      const nextValue = !twoFactorEnabled;
      const response = await api.updateTwoFactorSettings({
        enabled: nextValue,
      });
      if (response?.settings) {
        onSaved(response.settings);
      }
      setTwoFactorEnabled(nextValue);
      setStatus(`Two-factor authentication ${nextValue ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update two-factor authentication.');
    } finally {
      setSaving2FA(false);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader title="Change Password" />
        <div className="space-y-6 max-w-2xl">
          <InputField
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <InputField
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Password Requirements
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
              <li>Minimum 8 characters long - the more, the better</li>
              <li>At least one lowercase character</li>
              <li>At least one number, symbol, or whitespace character</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={savingPassword}
              className="bg-emerald-500 disabled:opacity-70 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <SectionHeader
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account."
          />
          <button
            type="button"
            onClick={handleToggleTwoFactor}
            disabled={saving2FA}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-emerald-800">
            2FA is currently {twoFactorEnabled ? 'enabled' : 'disabled'}
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Toggle the switch to update your two-factor setting in database.
          </p>
        </div>
      </div>

      {(status || error) && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-emerald-600'}`}>{error || status}</p>
      )}
    </motion.div>
  );
}
