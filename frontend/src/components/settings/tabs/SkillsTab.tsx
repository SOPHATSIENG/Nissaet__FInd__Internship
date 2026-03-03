import {Plus, Search, X} from 'lucide-react';
import {motion} from 'motion/react';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';
import {SelectField} from '../shared/SelectField';

const USER_SKILLS = [
  {name: 'JavaScript', proficiency: 'Intermediate'},
  {name: 'React.js', proficiency: 'Intermediate'},
  {name: 'Tailwind CSS', proficiency: 'Advanced'},
  {name: 'UI Design', proficiency: 'Beginner'},
  {name: 'Figma', proficiency: 'Intermediate'},
] as const;

const RECOMMENDED_SKILLS = [
  {name: 'Git & GitHub', category: 'Version Control'},
  {name: 'TypeScript', category: 'Web Development'},
  {name: 'Node.js', category: 'Backend'},
  {name: 'SQL', category: 'Database'},
  {name: 'Communication', category: 'Soft Skill'},
] as const;

export function SkillsTab() {
  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      className="flex flex-col md:flex-row gap-8"
    >
      <div className="flex-1 space-y-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <SectionHeader title="Add New Skill" description="Search and add skills to your profile." />
          <InputField
            placeholder="e.g. Python, UI/UX Design, Project Management"
            icon={Search}
          />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Your Skills</h3>
            <span className="text-sm text-slate-400">5 Added</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {USER_SKILLS.map((skill) => (
              <div
                key={skill.name}
                className="p-5 border border-slate-100 rounded-xl bg-slate-50/30 relative"
              >
                <button className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
                <p className="font-semibold text-slate-700 mb-4">{skill.name}</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Proficiency
                  </label>
                  <SelectField
                    options={['Beginner', 'Intermediate', 'Advanced']}
                    defaultValue={skill.proficiency}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/20">
              Save Skills
            </button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Plus size={18} />
            </div>
            <h3 className="font-semibold text-slate-800">Recommended for You</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Based on your major (Computer Science) and trending internships.
          </p>

          <div className="space-y-4">
            {RECOMMENDED_SKILLS.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{skill.name}</p>
                  <p className="text-[10px] text-slate-400">{skill.category}</p>
                </div>
                <button className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
