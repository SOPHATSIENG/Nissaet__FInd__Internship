import {Bell, GraduationCap} from 'lucide-react';

const NAV_ITEMS = ['Home', 'Internships', 'Companies', 'Career Advice'] as const;

export function SettingsHeader() {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">InternKhmer</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border-2 border-white shadow-sm">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
