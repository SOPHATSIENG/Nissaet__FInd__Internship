import {
  Search,
  MapPin,
  DollarSign,
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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

type PaginationState = {
  page: number;
};

const ITEMS_PER_PAGE = 10;

export default function Internships() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(Number.parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  
  // State for search and filters
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    searchParams.get("location")?.split(',').filter(Boolean) || []
  );
  const [locationQueryFilter, setLocationQueryFilter] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    searchParams.get("industry")?.split(',').filter(Boolean) || []
  );
  const [industryQuery, setIndustryQuery] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [selectedCompensation, setSelectedCompensation] = useState(searchParams.get("compensation") || "All");

  // Data state
  const [internships, setInternships] = useState<InternshipApiItem[]>([]);
  const [savedInternships, setSavedInternships] = useState<InternshipApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalInternships, setTotalInternships] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
  });
  const totalPages = totalInternships > 0 ? Math.ceil(totalInternships / ITEMS_PER_PAGE) : 0;
  const industryDropdownRef = useRef<HTMLDivElement | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const previousFilterSignature = useRef("");
  const previousPageRef = useRef(currentPage);

  // Debounced search term
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const nextQuery = searchParams.get("search") || "";
    const nextLocations = searchParams.get("location")?.split(',').filter(Boolean) || [];
    const nextIndustries = searchParams.get("industry")?.split(',').filter(Boolean) || [];
    const nextCompensation = searchParams.get("compensation") || "All";

    setQuery((prev) => prev === nextQuery ? prev : nextQuery);
    setSelectedLocations((prev) => JSON.stringify(prev) === JSON.stringify(nextLocations) ? prev : nextLocations);
    setSelectedIndustries((prev) => JSON.stringify(prev) === JSON.stringify(nextIndustries) ? prev : nextIndustries);
    setSelectedCompensation((prev) => prev === nextCompensation ? prev : nextCompensation);
  }, [searchParams]);

  const updatePage = useCallback((page: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    const filterSignature = JSON.stringify({
      search: debouncedQuery,
      location: selectedLocations,
      industry: selectedIndustries,
      compensation: selectedCompensation,
    });
    const filtersChanged = previousFilterSignature.current !== "" && previousFilterSignature.current !== filterSignature;
    const pageForUrl = filtersChanged ? 1 : currentPage;

    if (debouncedQuery) params.set("search", debouncedQuery);
    if (selectedLocations.length > 0) params.set("location", selectedLocations.join(','));
    if (selectedIndustries.length > 0) params.set("industry", selectedIndustries.join(','));
    if (selectedCompensation !== "All") params.set("compensation", selectedCompensation);
    if (pageForUrl > 1) params.set("page", String(pageForUrl));

    previousFilterSignature.current = filterSignature;
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, debouncedQuery, searchParams, selectedLocations, selectedIndustries, selectedCompensation, setSearchParams]);

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
        salary_type: selectedCompensation !== "All" ? selectedCompensation.toLowerCase() : undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      const res = await api.getInternships(params);
      setInternships(Array.isArray(res?.internships) ? res.internships : []);
      setTotalInternships(Number.isFinite(res?.total) ? res.total : 0);
      setPagination({
        page: Number.isFinite(res?.page) ? res.page : currentPage,
      });

      const responsePage = Number.isFinite(res?.page) ? res.page : currentPage;
      const responseTotalPages = Number.isFinite(res?.totalPages) ? res.totalPages : 1;
      if (responsePage !== currentPage) {
        updatePage(responsePage);
      } else if (responseTotalPages > 0 && currentPage > responseTotalPages) {
        updatePage(responseTotalPages);
      }
    } catch (err) {
      console.error('Internship load error:', err);
      setError("Failed to load internships. Please try again later.");
      setInternships([]);
      setTotalInternships(0);
      setPagination({
        page: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedQuery, selectedLocations, selectedIndustries, selectedCompensation, updatePage]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    previousPageRef.current = currentPage;
  }, [currentPage]);

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

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "E-commerce",
    "Telecommunications",
    "Logistics",
    "Hospitality",
    "Media & Entertainment",
    "Government",
    "Non-Profit",
    "Marketing",
    "Design",
    "Banking",
    "Retail",
    "Education",
    "Construction",
    "Manufacturing",
  ];
  const cambodiaProvinces = [
    "Phnom Penh",
    "Banteay Meanchey",
    "Battambang",
    "Kampong Cham",
    "Kampong Chhnang",
    "Kampong Speu",
    "Kampong Thom",
    "Kampot",
    "Kandal",
    "Kep",
    "Koh Kong",
    "Kratie",
    "Mondulkiri",
    "Oddar Meanchey",
    "Pailin",
    "Preah Vihear",
    "Prey Veng",
    "Pursat",
    "Ratanakiri",
    "Siem Reap",
    "Preah Sihanouk",
    "Stung Treng",
    "Svay Rieng",
    "Takeo",
    "Tbong Khmum",
    "Remote",
  ];

  const filteredIndustries = useMemo(() => {
    const queryValue = industryQuery.trim().toLowerCase();
    if (!queryValue) return industries;
    return industries.filter((industry) => industry.toLowerCase().includes(queryValue));
  }, [industryQuery, industries]);
  const filteredLocations = useMemo(() => {
    const queryValue = locationQueryFilter.trim().toLowerCase();
    if (!queryValue) return cambodiaProvinces;
    return cambodiaProvinces.filter((province) => province.toLowerCase().includes(queryValue));
  }, [locationQueryFilter, cambodiaProvinces]);

  useEffect(() => {
    if (!isIndustryOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!industryDropdownRef.current) return;
      if (!industryDropdownRef.current.contains(event.target as Node)) {
        setIsIndustryOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsIndustryOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isIndustryOpen]);

  useEffect(() => {
    if (!isLocationOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!locationDropdownRef.current) return;
      if (!locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLocationOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLocationOpen]);

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
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col items-start lg:flex-row lg:items-start gap-8">
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
                <div ref={industryDropdownRef} className="relative">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsIndustryOpen((open) => !open)}
                      className="flex-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {selectedIndustries.length === 0
                          ? "All Industries"
                          : selectedIndustries.length === 1
                            ? selectedIndustries[0]
                            : `${selectedIndustries.length} industries`}
                      </span>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isIndustryOpen ? "rotate-90" : ""}`} />
                    </button>
                    {selectedIndustries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIndustries([]);
                          updatePage(1);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2563eb] hover:bg-blue-100"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  {isIndustryOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl">
                      <div className="p-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={industryQuery}
                          onChange={(e) => setIndustryQuery(e.target.value)}
                          placeholder="Select Industry"
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{selectedIndustries.length > 0 ? `${selectedIndustries.length} selected` : "All Industries"}</span>
                          {selectedIndustries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIndustries([]);
                                updatePage(1);
                              }}
                              className="font-semibold text-[#3b82f6] hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIndustries([]);
                            updatePage(1);
                          }}
                          className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          All Industries
                        </button>
                        {filteredIndustries.length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No industries found.
                          </div>
                        )}
                        {filteredIndustries.map((industry) => {
                          const isSelected = selectedIndustries.includes(industry);
                          return (
                            <button
                              key={industry}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedIndustries(selectedIndustries.filter((item) => item !== industry));
                                } else {
                                  setSelectedIndustries([...selectedIndustries, industry]);
                                }
                                updatePage(1);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 ${
                                isSelected ? "text-[#2563eb] font-semibold" : "text-gray-700"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-[#2563eb]" : "bg-gray-300"}`} />
                                {industry}
                              </span>
                              {isSelected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Location
                </h4>
                <div ref={locationDropdownRef} className="relative">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLocationOpen((open) => !open)}
                      className="flex-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedLocations.length === 0
                          ? "All Locations"
                          : selectedLocations.length === 1
                            ? selectedLocations[0]
                            : `${selectedLocations.length} locations`}
                      </span>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isLocationOpen ? "rotate-90" : ""}`} />
                    </button>
                    {selectedLocations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocations([]);
                          updatePage(1);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2563eb] hover:bg-blue-100"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  {isLocationOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl">
                      <div className="p-3 border-b border-gray-100">
                        <input
                          type="text"
                          value={locationQueryFilter}
                          onChange={(e) => setLocationQueryFilter(e.target.value)}
                          placeholder="Select Location"
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{selectedLocations.length > 0 ? `${selectedLocations.length} selected` : "All Locations"}</span>
                          {selectedLocations.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLocations([]);
                                updatePage(1);
                              }}
                              className="font-semibold text-[#3b82f6] hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocations([]);
                            updatePage(1);
                          }}
                          className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          All Locations
                        </button>
                        {filteredLocations.length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No locations found.
                          </div>
                        )}
                        {filteredLocations.map((province) => {
                          const isSelected = selectedLocations.includes(province);
                          return (
                            <button
                              key={province}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedLocations(selectedLocations.filter((item) => item !== province));
                                } else {
                                  setSelectedLocations([...selectedLocations, province]);
                                }
                                updatePage(1);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 ${
                                isSelected ? "text-[#2563eb] font-semibold" : "text-gray-700"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-[#2563eb]" : "bg-gray-300"}`} />
                                {province}
                              </span>
                              {isSelected && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                      onClick={() => {
                        setSelectedCompensation(comp);
                        updatePage(1);
                      }}
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
                  setSelectedCompensation("All");
                  updatePage(1);
                }}
                className="w-full mt-6 py-2 text-sm font-bold text-gray-400 hover:text-[#3b82f6] transition-colors"
              >
                Clear all filters
              </button>
            </div>
            </aside>

            {/* Internship List Area */}
            <div ref={resultsRef} className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? "Searching..." : `${totalInternships} Internships found`}
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
                  cards.map((job) => (
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

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => updatePage(currentPage - 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-600 font-medium px-4">
                    Page {Math.min(Math.max(pagination.page || currentPage, 1), totalPages)} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => updatePage(currentPage + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
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
