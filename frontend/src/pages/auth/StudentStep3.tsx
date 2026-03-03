import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Search, Code, Palette, Plus, X } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Button } from '../../components/Button';

export function StudentStep3() {
  const navigate = useNavigate();

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard or success page
    alert('Registration Complete!');
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-[#137fec]/90 to-[#137fec]/40"
      title="Showcase Your Talent"
      subtitle="Tell us what you're good at. We'll match you with the perfect opportunities based on your unique skillset."
      stepIndicator={{ current: 3, total: 3 }}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Skills & Interests</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137fec] bg-[#137fec]/10 px-2 py-1 rounded">Step 3 of 3</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Select your skills and proficiency levels to customize your profile.
        </p>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Add Skills</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-0 bg-white py-3 pl-10 pr-12 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all"
              placeholder="Search skills (e.g. Python, SEO, UX Design)..."
            />
            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
              <kbd className="inline-flex items-center rounded border border-slate-200 px-1 font-sans text-xs text-slate-400">⌘K</kbd>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Categories</h3>
          
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code className="text-[#137fec] h-5 w-5 bg-[#137fec]/10 p-1 rounded-md" />
              <span className="text-sm font-bold text-slate-900">Development</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'Python', 'SQL'].map((skill) => (
                <button key={skill} type="button" className="group flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#137fec]/10 hover:text-[#137fec] transition-colors">
                  <span>{skill}</span>
                  <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="text-pink-500 h-5 w-5 bg-pink-500/10 p-1 rounded-md" />
              <span className="text-sm font-bold text-slate-900">Design</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Figma', 'UI/UX', 'Adobe Suite'].map((skill) => (
                <button key={skill} type="button" className="group flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-pink-500/10 hover:text-pink-600 transition-colors">
                  <span>{skill}</span>
                  <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-sm font-medium text-slate-700">Selected Skills & Proficiency</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200 group">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">JavaScript</span>
              <div className="flex items-center gap-4">
                <select className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 bg-slate-50 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#137fec] sm:text-xs sm:leading-6">
                  <option>Beginner</option>
                  <option selected>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <button type="button" className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200 group">
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">Product Design</span>
              <div className="flex items-center gap-4">
                <select className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 bg-slate-50 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#137fec] sm:text-xs sm:leading-6">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option selected>Advanced</option>
                </select>
                <button type="button" className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-1/3"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button type="submit" className="flex-1" icon={CheckCircle}>
            Finish Registration
          </Button>
        </div>
      </form>
    </SplitLayout>
  );
}
