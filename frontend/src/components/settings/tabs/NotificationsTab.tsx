import {Bell, Smartphone} from 'lucide-react';
import {motion} from 'motion/react';
import {SectionHeader} from '../shared/SectionHeader';

const NOTIFICATION_SECTIONS = [
  {
    title: 'New Internship Matches',
    desc: 'Get notified when new internships match your profile and skills.',
    email: true,
    inApp: true,
    hasFrequency: true,
  },
  {
    title: 'Application Status Changes',
    desc: 'Receive updates when an employer views your application or invites you for an interview.',
    email: true,
    inApp: true,
    hasFrequency: false,
  },
  {
    title: 'Career Tips & Advice',
    desc: 'Weekly tips on resume writing, interview preparation, and career growth.',
    email: false,
    inApp: false,
    hasFrequency: false,
  },
] as const;

const FREQUENCIES = ['Instant', 'Daily', 'Weekly'] as const;

export function NotificationsTab() {
  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader
          title="Notification Preferences"
          description="Control how and when you receive updates."
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
                      section.email ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        section.email ? 'translate-x-6' : 'translate-x-1'
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
                      section.inApp ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        section.inApp ? 'translate-x-6' : 'translate-x-1'
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
                        className={`px-8 py-2 text-sm font-medium rounded-lg transition-all ${
                          frequency === 'Daily'
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

        <div className="flex justify-end mt-12">
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20">
            Save Preferences
          </button>
        </div>
      </div>
    </motion.div>
  );
}
