import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Download, 
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentProfile = () => {
  return (
    <div className="flex flex-1 flex-col gap-8 p-8 overflow-y-auto no-scrollbar max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="size-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-1 shadow-lg">
            <div className="size-full rounded-2xl bg-surface-light flex items-center justify-center overflow-hidden font-black text-3xl text-blue-600">
              DS
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-text-primary-light tracking-tight">Dara Sok</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">Active Student</span>
            </div>
            <p className="text-text-secondary-light text-lg font-medium">Computer Science Student at NIPTICT</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary-light">
                <MapPin className="size-3.5" /> Phnom Penh, Cambodia
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary-light">
                <Calendar className="size-3.5" /> Joined Oct 2023
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light bg-surface-light text-text-secondary-light text-sm font-bold hover:bg-background-light transition-colors">
            <Mail className="size-4" /> Message
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-surface-dark text-sm font-bold shadow-md hover:bg-emerald-400 transition-all">
            <Download className="size-4" /> Download CV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="flex flex-col gap-4 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light flex items-center gap-2">
              <BookOpen className="size-5 text-primary" /> About Me
            </h3>
            <p className="text-text-secondary-light leading-relaxed">
              Passionate Computer Science student with a strong interest in Full-stack Development and AI. 
              Currently pursuing my Bachelor's degree at NIPTICT. I have experience working with React, 
              Node.js, and Python through various university projects and personal initiatives. 
              Looking for an internship opportunity to apply my skills in a professional environment 
              and contribute to impactful tech solutions in Cambodia.
            </p>
          </section>

          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" /> Education
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <GraduationCap className="size-6" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-text-primary-light">Bachelor of Computer Science</h4>
                  <p className="text-sm text-text-secondary-light">NIPTICT • 2021 - Present</p>
                  <p className="text-xs text-text-secondary-light mt-1 font-medium">GPA: 3.8/4.0</p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light flex items-center gap-2">
              <Award className="size-5 text-primary" /> Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Python', 'PostgreSQL', 'Git', 'UI/UX Design', 'Agile'].map(skill => (
                <span key={skill} className="px-4 py-2 rounded-xl bg-background-light border border-border-light text-sm font-bold text-text-primary-light">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-8">
          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light">Contact Info</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-background-light flex items-center justify-center text-text-secondary-light">
                  <Mail className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-secondary-light uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-text-primary-light">dara.sok@student.niptict.edu.kh</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-background-light flex items-center justify-center text-text-secondary-light">
                  <Phone className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-secondary-light uppercase tracking-wider">Phone</span>
                  <span className="text-sm font-medium text-text-primary-light">+855 12 345 678</span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6 p-8 rounded-2xl border border-border-light bg-surface-light shadow-sm">
            <h3 className="text-xl font-bold text-text-primary-light">Social Links</h3>
            <div className="flex flex-col gap-3">
              <a href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-background-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Linkedin className="size-5 text-text-secondary-light group-hover:text-[#0077b5]" />
                  <span className="text-sm font-bold text-text-primary-light">LinkedIn</span>
                </div>
                <ExternalLink className="size-4 text-border-light group-hover:text-text-secondary-light" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-background-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Github className="size-5 text-text-secondary-light group-hover:text-[#333]" />
                  <span className="text-sm font-bold text-text-primary-light">GitHub</span>
                </div>
                <ExternalLink className="size-4 text-border-light group-hover:text-text-secondary-light" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-background-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Globe className="size-5 text-text-secondary-light group-hover:text-primary" />
                  <span className="text-sm font-bold text-text-primary-light">Portfolio</span>
                </div>
                <ExternalLink className="size-4 text-border-light group-hover:text-text-secondary-light" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
