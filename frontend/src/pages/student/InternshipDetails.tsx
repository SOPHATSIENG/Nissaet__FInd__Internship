import { Bookmark, BriefcaseBusiness, Clock3, Code2, MapPin, Share2, WalletCards } from "lucide-react";
import { Link, useParams } from "react-router-dom";

type InternshipRecord = {
  id: string;
  title: string;
  company: string;
  postedAgo: string;
  location: string;
  duration: string;
  internshipType: string;
  skills: string[];
  description: string;
  deadline: string;
  heroImage: string;
  logo: string;
};

const INTERNSHIPS: Record<string, InternshipRecord> = {
  "1": {
    id: "1",
    title: "Software Engineering Intern",
    company: "TechCorp Solutions",
    postedAgo: "Posted 2 days ago",
    location: "Remote / San Francisco",
    duration: "12 Weeks",
    internshipType: "Paid Internship",
    skills: ["React", "Node.js", "TypeScript"],
    description:
      "Join our core engineering team to build scalable web applications. You'll work closely with senior developers to ship production-ready code, participate in sprint planning, and contribute to our design system. This is a high-impact role designed for students looking to sharpen their full-stack development skills.",
    deadline: "October 15, 2023",
    heroImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
    logo: "https://picsum.photos/seed/techcorp/120/120",
  },
  "2": {
    id: "2",
    title: "Frontend React Intern",
    company: "DigitalWave Studio",
    postedAgo: "Posted 1 day ago",
    location: "Phnom Penh / Hybrid",
    duration: "10 Weeks",
    internshipType: "Paid Internship",
    skills: ["React", "Tailwind CSS", "REST API"],
    description:
      "You will build polished, responsive UI features with React and Tailwind CSS. The internship includes mentorship, weekly feedback, and exposure to a modern product workflow from discovery to delivery.",
    deadline: "November 01, 2023",
    heroImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    logo: "https://picsum.photos/seed/digitalwave/120/120",
  },
  "3": {
    id: "3",
    title: "Graphic Design Intern",
    company: "Mango Tango Asia",
    postedAgo: "Posted 3 days ago",
    location: "Siem Reap / On-site",
    duration: "8 Weeks",
    internshipType: "Unpaid Internship",
    skills: ["Adobe Illustrator", "Photoshop", "Branding"],
    description:
      "Work with the creative team on campaign visuals, social media assets, and brand materials. This role is ideal for students who want to build practical design portfolio projects in a fast-paced studio environment.",
    deadline: "October 22, 2023",
    heroImage: "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?auto=format&fit=crop&w=1600&q=80",
    logo: "https://picsum.photos/seed/mango/120/120",
  },
  "4": {
    id: "4",
    title: "Audit Assistant Intern",
    company: "KPMG Cambodia",
    postedAgo: "Posted 5 days ago",
    location: "Phnom Penh / On-site",
    duration: "12 Weeks",
    internshipType: "Paid Internship",
    skills: ["Accounting", "Excel", "Reporting"],
    description:
      "Support the audit team by preparing workpapers, analyzing financial records, and documenting findings. You will gain direct exposure to client-facing audit workflows and professional reporting standards.",
    deadline: "November 10, 2023",
    heroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
    logo: "https://picsum.photos/seed/kpmg/120/120",
  },
};

export default function InternshipDetails() {
  const { id = "1" } = useParams();
  const internship = INTERNSHIPS[id] ?? INTERNSHIPS["1"];

  return (
    <div className="bg-[#f3f5f8] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1180px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BriefcaseBusiness size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Internship Details</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
              aria-label="Share internship"
            >
              <Share2 size={20} />
            </button>
            <button
              type="button"
              className="h-12 px-5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-2 text-lg font-medium"
            >
              <Bookmark size={18} />
              Save for Later
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 border-b border-slate-200">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={internship.heroImage}
              alt={`${internship.title} banner`}
              className="w-full h-[220px] md:h-[360px] object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute left-6 bottom-6 bg-indigo-700 text-white text-2xl md:text-base font-bold px-5 py-2 rounded-full uppercase tracking-wide">
              Hiring Now
            </span>
          </div>
        </div>

        <div className="px-6 md:px-8 py-6 border-b border-slate-200">
          <div className="flex items-start gap-5">
            <img
              src={internship.logo}
              alt={`${internship.company} logo`}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="pt-1">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">{internship.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-2xl md:text-3xl">
                <Link to="/companies/1" className="text-indigo-700 font-semibold hover:text-indigo-800 transition-colors">
                  {internship.company}
                </Link>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">{internship.postedAgo}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xl md:text-base">
              <MapPin size={16} className="text-indigo-700" />
              {internship.location}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xl md:text-base">
              <Clock3 size={16} className="text-indigo-700" />
              {internship.duration}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xl md:text-base">
              <WalletCards size={16} className="text-indigo-700" />
              {internship.internshipType}
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 py-8 md:py-10 min-h-[360px]">
          <div className="mb-8">
            <h3 className="text-4xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Code2 className="text-indigo-700" size={24} />
              Required Skills
            </h3>
            <div className="mt-5 flex flex-wrap gap-3">
              {internship.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-xl md:text-lg font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-4xl md:text-3xl font-bold text-slate-900">About the Role</h3>
            <p className="mt-4 text-2xl md:text-xl text-slate-700 leading-relaxed max-w-5xl">{internship.description}</p>
          </div>
        </div>

        <div className="px-6 md:px-8 py-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.12em] text-slate-400 uppercase">Application Deadline</p>
            <p className="text-2xl md:text-3xl font-semibold text-slate-900 mt-1">{internship.deadline}</p>
          </div>
          <button
            type="button"
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xl md:text-lg px-10 py-3 rounded-2xl shadow-[0_8px_24px_rgba(67,56,202,0.35)] transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
