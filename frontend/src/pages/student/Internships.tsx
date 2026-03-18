import {
  Search,
  MapPin,
  Code,
  Map,
  DollarSign,
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  logo: string;
};

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
  salary_type?: string;
  salary_min?: number;
  salary_max?: number;
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for search and filters
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || "");
  const [selectedSkill, setSelectedSkill] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedCompensation, setSelectedCompensation] = useState("All");

  // Data state
  const [internships, setInternships] = useState<InternshipApiItem[]>([]);
  const [matchingInternships, setMatchingInternships] = useState<InternshipApiItem[]>([]);
  const [savedInternships, setSavedInternships] = useState<InternshipApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillsFilter, setSkillsFilter] = useState<number[]>([]);
  const [minPositions, setMinPositions] = useState<number | "">("");
  const [maxPositions, setMaxPositions] = useState<number | "">("");
  const [positionFilter, setPositionFilter] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSkillChange = (id: number, checked: boolean) => {
    if (checked) setSkillsFilter([...skillsFilter, id]);
    else setSkillsFilter(skillsFilter.filter(sid => sid !== id));
    setCurrentPage(1);
  };

  // Utility to format salary text
  const salaryText = (item: InternshipApiItem) => {
    if (item.salary_type === "unpaid") return "Unpaid";
    if (item.salary_min && item.salary_max) return `$${item.salary_min} - $${item.salary_max}`;
    if (item.salary_min) return `$${item.salary_min}+`;
    return item.salary_type === "stipend" ? "Stipend" : "Paid";
  };

  // Fetch Internships from API based on search and filters
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Map UI filters to API parameters
        const params = {
          search: query,
          location: selectedLocation === "All Locations" ? locationQuery : selectedLocation,
          salary_type: selectedCompensation !== "All" ? selectedCompensation : undefined,
          skills: selectedSkill.length > 0 ? selectedSkill.join(',') : undefined,
        };

        const res = await api.getInternships(params);
        if (mounted) {
          setInternships(Array.isArray(res?.internships) ? res.internships : []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('Internship load error:', err);
        if (mounted) setError(`Failed to load internships. ${message}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [query, locationQuery, selectedLocation, selectedCompensation, selectedSkill]);

  // Fetch Matching Internships (Based on Student Profile)
  useEffect(() => {
    let mounted = true;
    const loadMatching = async () => {
      try {
        const res = await api.getMatchingInternships();
        if (mounted && res?.internships) {
          setMatchingInternships(res.internships);
        }
      } catch (err) {
        console.error("Failed to load matching internships:", err);
      }
    };
    loadMatching();
    return () => { mounted = false; };
  }, []);

  // Fetch saved internships
  useEffect(() => {
    let mounted = true;

    const loadSaved = async () => {
      try {
        const res = await api.getSavedInternships();
        if (mounted && res?.internships) {
          setSavedInternships(res.internships);
        }
      } catch (err) {
        console.error('Failed to load saved internships:', err);
      }
    };

    loadSaved();

    return () => { mounted = false; };
  }, []);

  // Transform API data to Card format for display
  const savedInternshipIds = useMemo(() => new Set(savedInternships.map((item) => item.id)), [savedInternships]);

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
        saved: savedInternshipIds.has(item.id),
        closed: false,
        logo: item.company_logo || `https://picsum.photos/seed/job-${item.id}/48/48`,
        isNew: item.created_at ? (new Date().getTime() - new Date(item.created_at).getTime()) < 604800000 : false,
      };
    });
  }, [internships, savedInternshipIds]);

  // Skill-based filtering (Client-side refinement)
  const filteredCards = useMemo(() => {
    if (selectedSkill.length === 0) return cards;
    return cards.filter(job => 
      selectedSkill.some(skill => 
        job.title.toLowerCase().includes(skill.toLowerCase()) || 
        job.tags.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
      )
    );
  }, [cards, selectedSkill]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCards, currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const refreshSavedData = async () => {
    try {
      const res = await api.getSavedInternships();
      if (res?.internships) setSavedInternships(res.internships);
    } catch (err) {
      console.error('Error refreshing saved internships:', err);
    }
  };

  const displayedPaginatedCards = paginatedCards;
  const pageTitle = loading ? 'Searching...' : `${filteredCards.length} Internships found`;

  const handleToggleSave = async (internshipId: number, currentlySaved: boolean) => {
    try {
      if (currentlySaved) {
        await api.unsaveInternship(internshipId);
      } else {
        await api.saveInternship(internshipId);
      }
      await refreshSavedData();
    } catch (err) {
      console.error('Error toggling saved internship:', err);
      alert((err as Error).message || 'Could not update save status.');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Search Header */}
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Dream Internship</h1>
          <p className="text-lg text-gray-500 mb-8">Kickstart your career with the best opportunities in Cambodia.</p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Job title, keywords, skills, or company"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
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
                onChange={(e) => { setLocationQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button type="submit" className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">Popular:</span>
            {["Frontend Developer", "Marketing Intern", "UX/UI Designer", "Accounting"].map((tag) => (
              <span
                key={tag}
                onClick={() => {
                  setSearchInput(tag);
                  setQuery(tag);
                  setSelectedSkill([]); // Clear selected skills when using popular search tags
                  setCurrentPage(1);
                }}
                className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7] flex-grow">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium bg-[#3b82f6]/10 text-[#2563eb]">
                  <Briefcase className="w-4 h-4" />
                  All Internships
                </div>
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
                {["JavaScript", "Python", "Node js", "React js", "JAVA", "Laravel", "PHP"].map((skill) => (
                  <label key={skill} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSkill.includes(skill)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSkill([...selectedSkill, skill]);
                          else setSelectedSkill(selectedSkill.filter(s => s !== skill));
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-gray-600 group-hover:text-gray-900">{skill}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#3b82f6]" /> Positions
              </h3>
              <div className="space-y-3">
                {["All Locations", "Phnom Penh", "Siem Reap","Kampot", "Remote"].map((loc) => (
                  <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="location"
                      checked={selectedLocation === loc}
                      onChange={() => { setSelectedLocation(loc); setCurrentPage(1); }}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">{loc}</span>
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
                {["All", "Paid", "Unpaid"].map((comp) => (
                  <button
                    key={comp}
                    onClick={() => { setSelectedCompensation(comp); setCurrentPage(1); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCompensation === comp
                        ? "bg-[#3b82f6]/10 text-[#2563eb] border border-[#3b82f6]/30"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Internship List Area */}
          <div className="flex-1">
            {error && (
              <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {loading ? "Searching..." : pageTitle}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Sort by:</span>
                <select className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer">
                  <option>Most Recent</option>
                  <option>Most Relevant</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {!loading && displayedPaginatedCards.length === 0 ? (
                <div className="bg-white p-20 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500 font-medium">
                  No internships match your criteria. Try adjusting your filters.
                </div>
              ) : (
                displayedPaginatedCards.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-[#3b82f6]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm"
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
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3 font-medium">
                          <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.pay}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {job.tags.map((tag) => (
                            <span key={tag} className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-md font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 justify-end items-stretch pt-4 md:pt-0">
                      <Link
                        to={`/internships/${job.id}`}
                        className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-center shadow-sm"
                      >
                        View Details
                      </Link>
                      <button
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                          job.saved
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => handleToggleSave(job.id, !!job.saved)}
                      >
                        <Bookmark className="w-4 h-4" /> {job.saved ? 'Unsave' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                        currentPage === page
                          ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}