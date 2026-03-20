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
  Building,
  Filter,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
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

const ITEMS_PER_PAGE = 10;

export default function Internships() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for search and filters
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    searchParams.get("location")?.split(',').filter(Boolean) || []
  );
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    searchParams.get("industry")?.split(',').filter(Boolean) || []
  );
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>(
    searchParams.get("companySize")?.split(',').filter(Boolean) || []
  );
  const [selectedCompensation, setSelectedCompensation] = useState(searchParams.get("compensation") || "All");

  // Data state
  const [internships, setInternships] = useState<InternshipApiItem[]>([]);
  const [savedInternships, setSavedInternships] = useState<InternshipApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search term
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Sync state with URL
  useEffect(() => {
    const params: any = {};
    if (debouncedQuery) params.search = debouncedQuery;
    if (selectedLocations.length > 0) params.location = selectedLocations.join(',');
    if (selectedIndustries.length > 0) params.industry = selectedIndustries.join(',');
    if (selectedCompanySizes.length > 0) params.companySize = selectedCompanySizes.join(',');
    if (selectedCompensation !== "All") params.compensation = selectedCompensation;
    
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedLocations, selectedIndustries, selectedCompanySizes, selectedCompensation]);

  // Utility to format salary text
  const salaryText = (item: InternshipApiItem) => {
    if (item.salary_type === "unpaid") return "Unpaid";
    if (item.salary_min && item.salary_max) return `$${item.salary_min} - $${item.salary_max}`;
    if (item.salary_min) return `$${item.salary_min}+`;
    return item.salary_type === "stipend" ? "Stipend" : "Paid";
  };

  // Fetch Internships from API based on search and filters
  const loadInternships = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        search: debouncedQuery,
        location: selectedLocations.length > 0 ? selectedLocations.join(',') : undefined,
        industry: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
        companySize: selectedCompanySizes.length > 0 ? selectedCompanySizes.join(',') : undefined,
        salary_type: selectedCompensation !== "All" ? selectedCompensation.toLowerCase() : undefined,
      };

      const res = await api.getInternships(params);
      setInternships(Array.isArray(res?.internships) ? res.internships : []);
    } catch (err) {
      console.error('Internship load error:', err);
      setError("Failed to load internships. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedLocations, selectedIndustries, selectedCompanySizes, selectedCompensation]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  // Fetch saved internships
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await api.getSavedInternships();
        if (res?.internships) {
          setSavedInternships(res.internships);
        }
      } catch (err) {
        console.error('Failed to load saved internships:', err);
      }
    };
    loadSaved();
  }, []);

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
        logo: item.company_logo || `https://picsum.photos/seed/job-${item.id}/48/48`,
        isNew: item.created_at ? (new Date().getTime() - new Date(item.created_at).getTime()) < 604800000 : false,
      };
    });
  }, [internships, savedInternshipIds]);

  const totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return cards.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [cards, currentPage]);

  const handleToggleSave = async (internshipId: number, currentlySaved: boolean) => {
    try {
      if (currentlySaved) {
        await api.unsaveInternship(internshipId);
        setSavedInternships(prev => prev.filter(item => item.id !== internshipId));
      } else {
        await api.saveInternship(internshipId);
        const res = await api.getSavedInternships();
        if (res?.internships) setSavedInternships(res.internships);
      }
    } catch (err) {
      console.error('Error toggling saved internship:', err);
    }
  };

  const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f8f7]">
      {/* Search Header */}
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
            <button className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 flex-grow">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-900">
                <Filter className="w-5 h-5 text-[#3b82f6]" /> Filters
              </h3>
              
              {/* Industry Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 size={16} /> Industry
                </h4>
                <div className="space-y-2">
                  {["Technology", "Finance", "Marketing", "Design", "Banking", "Retail"].map(industry => (
                    <label key={industry} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry)}
                        onChange={() => toggleFilter(selectedIndustries, setSelectedIndustries, industry)}
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Location
                </h4>
                <div className="space-y-2">
                  {["Phnom Penh", "Siem Reap", "Kampot", "Takeo", "Battambang", "Kampong Thom", "Remote"].map(loc => (
                    <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc)}
                        onChange={() => toggleFilter(selectedLocations, setSelectedLocations, loc)}
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{loc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company Size Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Building size={16} /> Company Size
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Start-up (1-10)", value: "1-10" },
                    { label: "Small (11-50)", value: "11-50" },
                    { label: "Medium (51-200)", value: "51-200" },
                    { label: "Large (201-500)", value: "201-500" },
                    { label: "Enterprise (501+)", value: "501-1000" }
                  ].map(size => (
                    <label key={size.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCompanySizes.includes(size.value)}
                        onChange={() => toggleFilter(selectedCompanySizes, setSelectedCompanySizes, size.value)}
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{size.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign size={16} /> Compensation
                </h4>
                <div className="flex gap-2">
                  {["All", "Paid", "Unpaid"].map((comp) => (
                    <button
                      key={comp}
                      onClick={() => setSelectedCompensation(comp)}
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

              <button 
                onClick={() => {
                  setQuery("");
                  setSelectedLocations([]);
                  setSelectedIndustries([]);
                  setSelectedCompanySizes([]);
                  setSelectedCompensation("All");
                }}
                className="w-full mt-6 py-2 text-sm font-bold text-gray-400 hover:text-[#3b82f6] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </aside>

          {/* Internship List Area */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {loading ? "Searching..." : `${cards.length} Internships found`}
              </h2>
            </div>

            {error && (
              <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-40"></div>
                ))
              ) : cards.length === 0 ? (
                <div className="bg-white p-20 rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">No internships match your criteria.</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                paginatedCards.map((job) => (
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
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                      onClick={() => setCurrentPage(page)}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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