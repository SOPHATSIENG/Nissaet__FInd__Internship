import {
  Search,
  MapPin,
  Code,
  Map,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";

type InternshipCard = {
  id: number;
  title: string;
  company: string;
  location: string;
  pay: string;
  tags: string[];
  isNew?: boolean;
  saved?: boolean;
  closed?: boolean;
  posted?: string;
  logo: string;
};

const recommendedInternships: InternshipCard[] = [
  {
    id: 1,
    title: "Junior UI Designer",
    company: "ABA Bank",
    location: "Phnom Penh",
    pay: "$200 - $400/mo",
    tags: ["Full-time", "$200 - $400/mo"],
    posted: "2 days ago",
    logo: "https://picsum.photos/seed/aba/48/48",
  },
  {
    id: 2,
    title: "React Frontend Intern",
    company: "Smart Axiata",
    location: "Phnom Penh",
    pay: "$300 - $500/mo",
    tags: ["Remote", "$300 - $500/mo"],
    posted: "5 hours ago",
    logo: "https://picsum.photos/seed/smart/48/48",
  },
];

const internshipJobs: InternshipCard[] = [
  {
    id: 1,
    title: "Social Media Marketing Intern",
    company: "Chip Mong Group",
    location: "Phnom Penh",
    pay: "$200/mo",
    tags: ["Marketing", "Content Creation", "Canva"],
    isNew: true,
    saved: false,
    logo: "https://picsum.photos/seed/chipmong/48/48",
  },
  {
    id: 2,
    title: "Web Development Intern (Python)",
    company: "Sabay Digital",
    location: "Phnom Penh",
    pay: "$300 - $450/mo",
    tags: ["Python", "Django", "API"],
    isNew: false,
    saved: false,
    logo: "https://picsum.photos/seed/sabay/48/48",
  },
  {
    id: 3,
    title: "Graphic Design Intern",
    company: "Mango Tango Asia",
    location: "Siem Reap",
    pay: "Unpaid",
    tags: ["Adobe Suite", "Illustration"],
    isNew: false,
    saved: true,
    closed: true,
    logo: "https://picsum.photos/seed/mango/48/48",
  },
  {
    id: 4,
    title: "Audit Assistant Intern",
    company: "KPMG Cambodia",
    location: "Phnom Penh",
    pay: "Competitive",
    tags: ["Accounting", "Excel"],
    isNew: false,
    saved: false,
    logo: "https://picsum.photos/seed/kpmg/48/48",
  },
];

export default function Internships() {
  return (
    <div className="flex flex-col">
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Dream Internship</h1>
          <p className="text-lg text-gray-500 mb-8">Kickstart your career with the best opportunities in Cambodia.</p>

          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="w-full outline-none text-gray-700 bg-transparent"
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Phnom Penh, Cambodia"
                className="w-full outline-none text-gray-700 bg-transparent"
              />
            </div>
            <button className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">Popular:</span>
            {["Frontend Developer", "Marketing Intern", "UI/UX Designer", "Accounting"].map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7] flex-grow">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-[#3b82f6]" /> Skills
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Frontend Dev", count: 12, checked: false },
                  { name: "Backend Dev", count: 8, checked: false },
                  { name: "UI/UX Design", count: 5, checked: true },
                  { name: "Data Science", count: 3, checked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-gray-600 group-hover:text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-[#3b82f6]" /> Location
              </h3>
              <div className="space-y-3">
                {[
                  { name: "All Locations", checked: true },
                  { name: "Phnom Penh", checked: false },
                  { name: "Siem Reap", checked: false },
                  { name: "Remote", checked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="location"
                      defaultChecked={item.checked}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">{item.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#3b82f6]" /> Compensation
              </h3>
              <div className="flex gap-2">
                {["All", "Paid", "Unpaid"].map((item, i) => (
                  <button
                    key={i}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      i === 0
                        ? "bg-[#3b82f6]/10 text-[#2563eb] border border-[#3b82f6]/30"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-12">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold">Recommended for you</h2>
                <Link to="/internships" className="text-[#3b82f6] font-bold hover:underline">
                  View All →
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {recommendedInternships.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-bl-full -z-10"></div>
                    <div className="flex items-start gap-4 mb-4">
                      <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <Link
                          to={`/internships/${job.id}`}
                          className="font-bold text-lg leading-tight hover:text-[#3b82f6] transition-colors"
                        >
                          {job.title}
                        </Link>
                        <p className="text-gray-500 text-sm">
                          {job.company} | {job.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-md font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-gray-400 text-xs">Posted {job.posted}</span>
                      <Link to={`/internships/${job.id}`} className="text-[#3b82f6] font-bold text-sm hover:underline">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">142 Internships found</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Sort by:</span>
                  <select className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer">
                    <option>Most Recent</option>
                    <option>Highest Paid</option>
                    <option>Most Relevant</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {internshipJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`bg-white p-6 rounded-2xl border ${
                      job.closed ? "border-gray-100 opacity-75" : "border-gray-100 hover:border-[#3b82f6]/50"
                    } shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={job.logo}
                        alt={job.company}
                        className={`w-12 h-12 rounded-xl object-cover ${job.closed ? "grayscale" : ""}`}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            to={`/internships/${job.id}`}
                            className="font-bold text-lg hover:text-[#3b82f6] transition-colors"
                          >
                            {job.title}
                          </Link>
                          {job.isNew && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" /> {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> {job.pay}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {job.tags.map((tag) => (
                            <span key={tag} className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 justify-end items-center md:items-stretch border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                      {job.closed ? (
                        <button className="flex-1 md:flex-none bg-gray-100 text-gray-500 font-bold px-6 py-2.5 rounded-xl cursor-not-allowed">
                          Closed
                        </button>
                      ) : (
                        <Link
                          to={`/internships/${job.id}`}
                          className="flex-1 md:flex-none bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] font-bold px-6 py-2.5 rounded-xl transition-colors text-center"
                        >
                          View Details
                        </Link>
                      )}
                      <button
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                          job.saved ? "bg-[#3b82f6]/10 text-[#2563eb]" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {job.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {job.saved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center gap-2 mt-12">
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  &lt;
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#3b82f6] text-[#111816] font-bold">
                  1
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                  2
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                  3
                </button>
                <span className="text-gray-400">...</span>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                  8
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
