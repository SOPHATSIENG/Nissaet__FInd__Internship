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
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

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

type InternshipApiItem = {
  id: number;
  title: string;
  company_name: string;
  location: string;
  salary_type: string;
  salary_min: number | null;
  salary_max: number | null;
  work_mode: string;
  company_logo: string | null;
  created_at?: string;
};

export default function Internships() {
  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [internships, setInternships] = useState<InternshipApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.getInternships();
        const items = Array.isArray(res?.internships) ? res.internships : [];
        if (mounted) {
          setInternships(items);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load internships");
        setInternships([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const salaryText = (item: InternshipApiItem) => {
    if (item.salary_type === "unpaid") {
      return "Unpaid";
    }
    if (item.salary_min && item.salary_max) {
      return `$${item.salary_min} - $${item.salary_max}`;
    }
    if (item.salary_min) {
      return `$${item.salary_min}+`;
    }
    return item.salary_type === "stipend" ? "Stipend" : "Paid";
  };

  const cards: InternshipCard[] = useMemo(() => {
    return internships.map((item) => {
      const tags = [item.work_mode, salaryText(item)].filter(Boolean);
      return {
        id: item.id,
        title: item.title,
        company: item.company_name,
        location: item.location,
        pay: salaryText(item),
        tags,
        saved: false,
        closed: false,
        logo: item.company_logo || `https://picsum.photos/seed/internship-${item.id}/48/48`,
      };
    });
  }, [internships]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = locationQuery.trim().toLowerCase();
    return cards.filter((job) => {
      const matchQuery = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q);
      const matchLoc = !loc || job.location.toLowerCase().includes(loc);
      return matchQuery && matchLoc;
    });
  }, [cards, query, locationQuery]);

  const recommendedInternships = filteredCards.slice(0, 2);

  return (
    <div className="flex flex-col">
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Dream Internship</h1>
          <p className="text-lg text-gray-500 mb-8">Kickstart your career with the best opportunities in Cambodia.</p>

          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Phnom Penh, Cambodia"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <button className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
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
            {error && (
              <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

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
                      <span className="text-gray-400 text-xs">Posted {job.posted || ""}</span>
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
                <h2 className="text-2xl font-bold">
                  {loading ? "Loading internships..." : `${filteredCards.length} Internships found`}
                </h2>
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
                {!loading && filteredCards.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                    No internships found.
                  </div>
                ) : (
                  filteredCards.map((job) => (
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
                  ))
                )}
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
