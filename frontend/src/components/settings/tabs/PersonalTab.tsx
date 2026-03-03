import {Camera, Trash2, Upload} from 'lucide-react';
import {motion} from 'motion/react';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';
import {SelectField} from '../shared/SelectField';

export function PersonalTab() {
  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
          <button className="text-emerald-600 text-sm font-medium hover:underline">Edit</button>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                <img
                  src="https://picsum.photos/seed/jane/200/200"
                  alt="Profile"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="text-center">
              <button className="text-emerald-600 text-sm font-semibold">Change Photo</button>
              <p className="text-xs text-slate-400 mt-1">Allowed JPG, GIF or PNG. Max size of 800K</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="First Name" defaultValue="Jane" />
              <InputField label="Last Name" defaultValue="Doe" />
              <InputField label="Email Address" defaultValue="jane.doe@student.com" />
              <InputField label="Phone Number" defaultValue="+855 12 345 678" />
              <InputField label="Date of Birth" type="date" defaultValue="2002-05-15" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-600">Bio</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[120px]"
                defaultValue="Passionate Computer Science student at RUPP with a strong interest in web development and UI/UX design. Eager to learn and contribute to real-world projects."
              />
              <p className="text-right text-xs text-slate-400">145/500 characters</p>
            </div>
            <div className="flex justify-end">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader title="Education & CV" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SelectField
            label="University / Institute"
            options={['Royal University of Phnom Penh (RUPP)', 'ITC', 'Zaman', 'AUPP']}
            defaultValue="Royal University of Phnom Penh (RUPP)"
          />
          <InputField label="Major" defaultValue="Computer Science" />
          <SelectField
            label="Graduation Year (Expected)"
            options={['2023', '2024', '2025', '2026']}
            defaultValue="2025"
          />
          <InputField label="Current GPA (Optional)" defaultValue="3.5" />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-600">Resume / CV</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">PDF only (max. 5MB)</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <span className="text-[10px] font-bold">PDF</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Jane_Doe_CV_2024.pdf</p>
                <p className="text-xs text-slate-400">2.4 MB - Uploaded 2 days ago</p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20">
            Update Education
          </button>
        </div>
      </div>
    </motion.div>
  );
}
