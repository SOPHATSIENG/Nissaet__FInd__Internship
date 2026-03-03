import {CheckCircle2, Laptop, Smartphone} from 'lucide-react';
import {motion} from 'motion/react';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';

const LOGIN_HISTORY = [
  {
    id: '1',
    device: 'Macbook Pro',
    location: 'Phnom Penh, Cambodia',
    browser: 'Chrome',
    time: 'Just now',
    isCurrent: true,
    icon: Laptop,
  },
  {
    id: '2',
    device: 'iPhone 13',
    location: 'Siem Reap, Cambodia',
    browser: 'Safari',
    time: '2 days ago',
    // FIX MARK: keep shape consistent for all login records.
    isCurrent: false,
    icon: Smartphone,
  },
  {
    id: '3',
    device: 'Windows PC',
    location: 'Phnom Penh, Cambodia',
    browser: 'Edge',
    time: '1 week ago',
    // FIX MARK: keep shape consistent for all login records.
    isCurrent: false,
    icon: Laptop,
  },
] as const;

export function SecurityTab() {
  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader title="Change Password" />
        <div className="space-y-6 max-w-2xl">
          <InputField
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="New Password" type="password" placeholder="Min 8 characters" />
            <InputField
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
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
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20">
              Update Password
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
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors focus:outline-none">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
          </button>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
          <div className="text-emerald-500 mt-0.5">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">2FA is currently disabled</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              When enabled, we'll ask for a verification code via email or SMS whenever you log in
              from a new device.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader title="Connected Accounts" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Google</p>
                <p className="text-xs text-slate-400">jane.doe@student.com</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-red-500 border border-red-100 px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Disconnect
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Smartphone size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Facebook</p>
                <p className="text-xs text-slate-400">Not connected</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-slate-500 border border-slate-100 px-4 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              Connect
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <SectionHeader title="Login History" />
          <button className="text-xs font-semibold text-red-500 hover:underline">
            Log out all devices
          </button>
        </div>
        <div className="space-y-6">
          {LOGIN_HISTORY.map((login) => (
            <div key={login.id} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <login.icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700">{login.device}</p>
                  {login.isCurrent && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {login.location} - {login.browser} - {login.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
