import {GraduationCap} from 'lucide-react';

export function SettingsFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-20 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                <GraduationCap size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800">InternKhmer</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Connecting Cambodian students with their future careers.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 mb-6">For Students</h5>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Browse Internships
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Create Profile
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Job Alerts
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 mb-6">For Employers</h5>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Post a Job
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-800 mb-6">Support</h5>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 text-center">
          <p className="text-xs text-slate-400">(c) 2024 InternKhmer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
