import {
  Search,
  MapPin,
  Code,
  Map,
  DollarSign,
  Bookmark,
  Building2,
  Plus,
  Users,
  Briefcase,
  Home,
  Laptop,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

type InternshipApiItem = {
  id: number;
  title: string;
  company_name: string;
  location: string;
  stipend: number;
  stipend_currency: string;
  type: string;
  status: string;
  work_mode: string;
  company_logo: string | null;
  created_at?: string;
  is_remote?: number;
  is_hybrid?: number;
  isNew?: boolean;
  saved?: boolean;
  closed?: boolean;
  applicationStatus?: string;
};

type Skill = {
  id: number;
  name: string;
};

type ApplicationStatus = {
  [key: number]: string;
};

const ITEMS_PER_PAGE = 10;

export default function Internships() {
  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<number | "">("");
  const [minPositions, setMinPositions] = useState<number | "">("");
  const [maxPositions, setMaxPositions] = useState<number | "">("");
  const [workModeFilter, setWorkModeFilter] = useState<string>("");
  const [skillsFilter, setSkillsFilter] = useState<number[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [internships, setInternships] = useState<InternshipApiItem[]>([]);
  const [matchingInternships, setMatchingInternships] = useState<InternshipApiItem[]>([]);
  const [savedInternships, setSavedInternships] = useState<InternshipApiItem[]>([]);
  const [myApplications, setMyApplications] = useState<ApplicationStatus>({});
  const [loading, setLoading] = useState(true);
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [compFilter, setCompFilter] = useState("All");

  const fetchInternships = async (search?: string) => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, unknown> = {};
      if (search || query) params.search = search ?? query;
      if (locationQuery) params.location = locationQuery;
      if (positionFilter) params.position = positionFilter;
      if (minPositions) params.minPositions = minPositions;
      if (maxPositions) params.maxPositions = maxPositions;
      if (workModeFilter) params.work_mode = workModeFilter;
      if (skillsFilter.length > 0) params.skills = skillsFilter.join(",");
      if (compFilter === "Paid") params.min_stipend = 1;
      else if (compFilter === "Unpaid") params.max_stipend = 0;

      const res = await api.getInternships(params);
      const items: InternshipApiItem[] = Array.isArray(res?.internships) ? res.internships : [];
      setInternships(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load internships");
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await api.getSkills();
        if (res?.skills) setAvailableSkills(res.skills);
      } catch (err) {
        console.error("Failed to load skills:", err);
      }
    };
    loadSkills();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadMatching = async () => {
      try {
        setLoadingMatching(true);
        const res = await api.getMatchingInternships();
        if (mounted) setMatchingInternships(Array.isArray(res?.internships) ? res.internships : []);
      } catch {
        if (mounted) setMatchingInternships([]);
      } finally {
        if (mounted) setLoadingMatching(false);
      }
    };

    const loadSaved = async () => {
      try {
        setLoadingSaved(true);
        const res = await api.getSavedInternships();
        if (mounted) setSavedInternships(Array.isArray(res?.internships) ? res.internships : []);
      } catch {
        if (mounted) setSavedInternships([]);
      } finally {
        if (mounted) setLoadingSaved(false);
      }
    };

    const loadApplications = async () => {
      try {
        const res = await api.getMyApplications();
        if (mounted && res?.applications) {
          const appStatus: ApplicationStatus = {};
          res.applications.forEach((app: { internship_id: number; status: string }) => {
            appStatus[app.internship_id] = app.status;
          });
          setMyApplications(appStatus);
        }
      } catch {
        if (mounted) setMyApplications({});
      }
    };

    fetchInternships();
    loadMatching();
    loadSaved();
    loadApplications();

    return () => { mounted = false; };
  }, [query, locationQuery, positionFilter, minPositions, maxPositions, workModeFilter, skillsFilter, compFilter]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, locationQuery, workModeFilter, skillsFilter, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    setLocationQuery(locationInput);
  };

  const handleToggleSave = async (internshipId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await api.unsaveInternship(internshipId);
        setSavedInternships((prev) => prev.filter((i) => i.id !== internshipId));
      } else {
        await api.saveInternship(internshipId);
        const internshipToSave = internships.find((i) => i.id === internshipId);
        if (internshipToSave) setSavedInternships((prev) => [...prev, internshipToSave]);
      }
      setInternships((prev) =>
        prev.map((i) => (i.id === internshipId ? { ...i, saved: !isSaved } : i))
      );
    } catch (err) {
      console.error("Failed to toggle save:", err);
    }
  };

  const handleSkillChange = (skillId: number, checked: boolean) => {
    setSkillsFilter((prev) => checked ? [...prev, skillId] : prev.filter((id) => id !== skillId));
  };

  const getWorkModeDisplay = (item: InternshipApiItem) => {
    if (item.is_remote === 1) return "Remote";
    if (item.is_hybrid === 1) return "Hybrid";
    return item.work_mode || "On-site";
  };

  const salaryText = (job: InternshipApiItem) => {
    if (!job.stipend || job.stipend === 0) return "Unpaid";
    return `${job.stipend_currency || "$"}${job.stipend}/mo`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "reviewing": return "bg-blue-100 text-blue-700";
      case "accepted": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const displayedInternships = useMemo(() => {
    if (activeTab === "saved") return savedInternships;
    return internships;
  }, [internships, savedInternships, activeTab]);

  const totalPages = Math.ceil(displayedInternships.length / ITEMS_PER_PAGE);

  const paginatedInternships = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedInternships.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedInternships, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const recommendedInternships = matchingInternships.length > 0
    ? matchingInternships.slice(0, 2)
    : internships.slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Dream Internship</h1>
          <p className="text-lg text-gray-500 mb-8">Kickstart your career with the best opportunities in Cambodia.</p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Phnom Penh, Cambodia"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
              />
            </div>
            <button type="submit" className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">Popular:</span>
            {["Frontend", "Marketing", "UI/UX", "Accounting"].map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => { setSearchInput(tag); setQuery(tag); }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7] flex-grow">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    activeTab === "all" ? "bg-[#3b82f6]/10 text-[#2563eb]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  All Internships
                </button>
                <button
                  onClick={() => setActiveTab("saved")}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    activeTab === "saved" ? "bg-[#3b82f6]/10 text-[#2563eb]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Saved ({savedInternships.length})
                </button>
                <button
                  onClick={() => setActiveTab("applied")}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    activeTab === "applied" ? "bg-[#3b82f6]/10 text-[#2563eb]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  My Applications
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-[#3b82f6]" /> Skills
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {availableSkills.length > 0 ? (
                  availableSkills.slice(0, 10).map((skill) => (
                    <label key={skill.id} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={skillsFilter.includes(skill.id)}
                          onChange={(e) => handleSkillChange(skill.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                        />
                        <span className="text-gray-600 group-hover:text-gray-900">{skill.name}</span>
                      </div>
                    </label>
                  ))
                ) : (
                  ["Frontend Dev", "Backend Dev", "UI/UX Design", "Data Science"].map((name) => (
                    <label key={name} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" disabled />
                      <span className="text-gray-400">{name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-[#3b82f6]" /> Work Mode
              </h3>
              <div className="space-y-3">
                {[
                  { name: "All Modes", value: "", icon: Building2 },
                  { name: "Remote", value: "remote", icon: Laptop },
                  { name: "Hybrid", value: "hybrid", icon: Home },
                  { name: "On-site", value: "onsite", icon: Building2 },
                ].map((item) => (
                  <label key={item.name} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="workMode"
                      value={item.value}
                      checked={workModeFilter === item.value}
                      onChange={(e) => setWorkModeFilter(e.target.value)}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#3b82f6]" /> Positions
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="position"
                    checked={positionFilter === "" && minPositions === "" && maxPositions === ""}
                    onChange={() => { setPositionFilter(""); setMinPositions(""); setMaxPositions(""); }}
                    className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                  />
                  <span className="text-gray-600 group-hover:text-gray-900">All Positions</span>
                </label>
                {[1, 2, 3, 5, 10].map((num) => (
                  <label key={num} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="position"
                      checked={positionFilter === num}
                      onChange={() => { setPositionFilter(num); setMinPositions(""); setMaxPositions(""); }}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">{num} {num === 1 ? "position" : "positions"}</span>
                  </label>
                ))}
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Custom range:</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Min"
                      value={minPositions}
                      onChange={(e) => { setPositionFilter(""); setMinPositions(e.target.value ? parseInt(e.target.value) : ""); }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-400 self-center">-</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Max"
                      value={maxPositions}
                      onChange={(e) => { setPositionFilter(""); setMaxPositions(e.target.value ? parseInt(e.target.value) : ""); }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3b82f6]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[#3b82f6]" /> Compensation
              </h3>
              <div className="flex gap-2">
                {["All", "Paid", "Unpaid"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setCompFilter(item)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      compFilter === item
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

          {/* Main Content */}
          <div className="flex-1">
            {error && (
              <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {activeTab !== "applied" && (
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {matchingInternships.length > 0 ? "Matching Internships" : "Recommended for you"}
                    </h2>
                    {matchingInternships.length > 0 && (
                      <p className="text-gray-500 text-sm mt-1">
                        Based on your skills ({matchingInternships.length} found)
                      </p>
                    )}
                  </div>
                  <Link to="/internships" className="text-[#3b82f6] font-bold hover:underline">
                    View All
                  </Link>
                </div>

                {loadingMatching ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                          <div className="flex-1">
                            <div className="h-6 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : matchingInternships.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Code className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No registered skills found</h3>
                    <p className="text-gray-500 mb-4">Add skills in Student Settings to get matching internships.</p>
                    <Link
                      to="/settings?tab=skills"
                      className="inline-flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Skills
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {recommendedInternships.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-bl-full -z-10"></div>
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={job.company_logo || `https://picsum.photos/seed/internship-${job.id}/48/48`}
                            alt={job.company_name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <Link to={`/internships/${job.id}`} className="font-bold text-lg leading-tight hover:text-[#3b82f6] transition-colors">
                              {job.title}
                            </Link>
                            <p className="text-gray-500 text-sm">{job.company_name} | {job.location}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-6">
                          <span className="bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-md font-medium">
                            {getWorkModeDisplay(job)}
                          </span>
                          <span className="bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-md font-medium">
                            {salaryText(job)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <span className="text-gray-400 text-xs">Posted {job.created_at || ""}</span>
                          <Link to={`/internships/${job.id}`} className="text-[#3b82f6] font-bold text-sm hover:underline">
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "applied" && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">My Applications</h2>
                {Object.keys(myApplications).length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No applications yet</h3>
                    <p className="text-gray-500">Start applying to internships to track your applications here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {internships
                      .filter((internship) => myApplications[internship.id])
                      .map((job) => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-start gap-4 flex-1">
                            <img
                              src={job.company_logo || `https://picsum.photos/seed/internship-${job.id}/48/48`}
                              alt={job.company_name}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Link to={`/internships/${job.id}`} className="font-bold text-lg hover:text-[#3b82f6] transition-colors">
                                  {job.title}
                                </Link>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadge(myApplications[job.id])}`}>
                                  {myApplications[job.id]}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company_name}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {loading ? "Loading internships..." :
                    activeTab === "saved"
                      ? `${displayedInternships.length} Saved Internships`
                      : activeTab === "applied"
                        ? `${Object.keys(myApplications).length} Applications`
                        : `${displayedInternships.length} Internships found`
                  }
                </h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p>Finding the best opportunities for you...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedInternships.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#3b82f6]/50 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={job.company_logo || `https://picsum.photos/seed/logo-${job.id}/48/48`}
                          alt={job.company_name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={`/internships/${job.id}`} className="font-bold text-lg hover:text-[#3b82f6] transition-colors">
                              {job.title}
                            </Link>
                            {job.applicationStatus && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadge(job.applicationStatus)}`}>
                                {job.applicationStatus}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company_name}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                            <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {salaryText(job)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-md capitalize">{job.work_mode || getWorkModeDisplay(job)}</span>
                            <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-md capitalize">{job.type}</span>
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
                            className="flex-1 md:flex-none bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-center"
                          >
                            View Details
                          </Link>
                        )}
                        <button
                          onClick={() => handleToggleSave(job.id, savedInternships.some((s) => s.id === job.id))}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                            savedInternships.some((s) => s.id === job.id)
                              ? "bg-[#3b82f6]/10 text-[#2563eb]"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                          {savedInternships.some((s) => s.id === job.id) ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {!displayedInternships.length && (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                      <p className="text-gray-500">No internships found matching your criteria.</p>
                      <button
                        onClick={() => { setQuery(""); setLocationQuery(""); setSearchInput(""); setLocationInput(""); setSkillsFilter([]); setWorkModeFilter(""); setCompFilter("All"); }}
                        className="mt-4 text-[#3b82f6] font-bold hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  {visiblePages.map((page, idx) => {
                    if (typeof page !== "number") {
                      return <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">...</span>;
                    }
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                          page === currentPage ? "bg-[#3b82f6] text-white font-bold" : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
