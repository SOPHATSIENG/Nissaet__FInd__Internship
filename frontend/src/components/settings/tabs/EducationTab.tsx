import {Download, Trash2, Upload} from 'lucide-react';
import {motion} from 'motion/react';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';
import {SelectField} from '../shared/SelectField';

export function EducationTab() {
  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader
          title="Education Background"
          description="Keep your educational details up to date to find relevant opportunities."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SelectField
            label="University / Institute"
            options={['Royal University of Phnom Penh (RUPP)', 'ITC', 'Zaman', 'AUPP']}
            defaultValue="Royal University of Phnom Penh (RUPP)"
          />
          <InputField label="Major" defaultValue="Computer Science" />
          <SelectField
            label="Graduation Year"
            options={['2023', '2024', '2025', '2026']}
            defaultValue="2025"
          />
          <InputField label="GPA" defaultValue="3.5" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-600">Resume / CV</label>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Required for applications
            </span>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">
                Supported formats: PDF, DOC, DOCX (Max. 5MB)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Uploaded Documents
            </p>
            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <span className="text-[10px] font-bold">PDF</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700">Jane_Doe_Resume_2024.pdf</p>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                      Primary
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">2.4 MB - Uploaded 2 days ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Download size={18} />
                </button>
                <button className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <span className="text-[10px] font-bold">DOC</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Transcript_Year_3.docx</p>
                  <p className="text-xs text-slate-400">1.8 MB - Uploaded 1 month ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Download size={18} />
                </button>
                <button className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-12 gap-4">
          <button className="text-slate-500 font-semibold px-6 py-2.5">Cancel</button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20">
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}
