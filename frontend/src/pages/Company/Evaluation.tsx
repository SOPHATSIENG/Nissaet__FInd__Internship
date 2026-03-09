import React from 'react';
import { 
  Star, 
  MessageSquare, 
  Send, 
  User, 
  Building2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Evaluation() {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 md:px-6 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Internship Evaluation</h1>
        <p className="text-slate-500 mt-2">Please provide your feedback on the internship experience. Your evaluation helps us improve the platform.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-4">
            <img className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-sm" src="https://picsum.photos/seed/student1/100/100" alt="Student" />
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Intern</p>
              <h3 className="text-lg font-bold text-slate-900">Sophea Chan</h3>
              <p className="text-sm text-slate-500">Marketing Intern</p>
            </div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200"></div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
              <Building2 size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company</p>
              <h3 className="text-lg font-bold text-slate-900">ABA Bank</h3>
              <p className="text-sm text-slate-500">Phnom Penh, Cambodia</p>
            </div>
          </div>
        </div>

        <form className="p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
          <section>
            <h4 className="text-lg font-bold text-slate-900 mb-4">Overall Performance</h4>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  type="button" 
                  className="group flex flex-col items-center gap-2"
                >
                  <div className={`p-3 rounded-xl border-2 transition-all ${
                    star <= 4 ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-300 hover:border-primary/50'
                  }`}>
                    <Star size={32} fill={star <= 4 ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{star}</span>
                </button>
              ))}
              <span className="ml-4 text-sm font-bold text-slate-900">Great (4/5)</span>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Technical Skills</h4>
              <div className="space-y-4">
                {['Knowledge', 'Efficiency', 'Quality'].map(skill => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                      <span>{skill}</span>
                      <span>80%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Soft Skills</h4>
              <div className="space-y-4">
                {['Communication', 'Teamwork', 'Punctuality'].map(skill => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                      <span>{skill}</span>
                      <span>90%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section>
            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Written Feedback
            </h4>
            <textarea 
              className="w-full rounded-xl border-slate-200 focus:ring-primary focus:border-primary py-4 px-4 min-h-[150px] text-slate-700" 
              placeholder="Provide detailed feedback on the intern's strengths and areas for improvement..."
            ></textarea>
          </section>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This evaluation will be shared with the student and will contribute to their public profile rating. Please be constructive and professional.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-3 text-sm font-bold text-background-dark shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
              <Send size={20} />
              Submit Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
