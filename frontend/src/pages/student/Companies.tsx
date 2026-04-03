import { Search, MapPin, Building2, Map, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check, X, Star } from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

interface Company {
  id: number;
  company_name: string;
  description: string;
  logo: string | null;
  industry: string;
  location: string | null;
  is_verified: boolean;
  company_size: string | null;
  open_positions: number;
  rating?: number | null;
  rating_count?: number | null;
};

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 12;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || "");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industryQuery, setIndustryQuery] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [locationQueryFilter, setLocationQueryFilter] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const totalFound = totalCount;
  const totalPages = totalFound > 0 ? Math.ceil(totalFound / pageSize) : 0;
  const featuredCompanies: Company[] = []; // Placeholder

  const loadCompanies = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      setError("");
      
      const params = {
        search: searchQuery,
        location: selectedLocation === "All Locations" ? locationQuery : selectedLocation,
        industries: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
        page,
        limit: pageSize,
      };
      
      const res = await api.getCompanies(params);
      if (mounted) {
        const items = Array.isArray(res?.companies) ? res.companies : [];
        setCompanies(items);
        const total = Number(res?.total);
        setTotalCount(Number.isFinite(total) ? total : items.length);
      }
    } catch (err) {
      if (mounted) setError("Failed to load companies");
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  }, [searchQuery, locationQuery, selectedLocation, selectedIndustries, page]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ page: 1 });
  };

  const featuredCompaniesForDisplay = useMemo(() => {
    if (featuredCompanies.length > 0) return featuredCompanies;
    return companies.slice(0, 2); // Show first 2 as featured if no explicit featured ones
  }, [featuredCompanies, companies]);

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
    "Banking",
    "Marketing",
    "Education",
    "Construction",
    "Manufacturing",
  ];

  const industryDropdownRef = useRef<HTMLDivElement | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);

  const hasIndustryFilter = selectedIndustries.length > 0;
  const hasSearchFilter = Boolean(searchQuery.trim());
  const hasLocationFilter = Boolean(locationQuery.trim()) || selectedLocation !== "All Locations";
  const hasAnyFilter = hasIndustryFilter || hasSearchFilter || hasLocationFilter;
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
    const query = industryQuery.trim().toLowerCase();
    if (!query) return industries;
    return industries.filter((industry) => industry.toLowerCase().includes(query));
  }, [industryQuery, industries]);
  const filteredLocations = useMemo(() => {
    const query = locationQueryFilter.trim().toLowerCase();
    if (!query) return cambodiaProvinces;
    return cambodiaProvinces.filter((province) => province.toLowerCase().includes(query));
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
    <div className="flex flex-col">
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Discover Top Companies
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Explore the best workplaces in Cambodia and find your perfect
            internship match.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by company name..."
                className="w-full outline-none text-gray-700 bg-transparent"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); updateFilters({ page: 1 }); }}
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Location"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); updateFilters({ page: 1 }); }}
              />
            </div>
            <button type="submit" className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">
              Top Industries:
            </span>
            {industries.slice(0, 4).map((ind) => {
              const isActive = selectedIndustries.includes(ind);
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => {
                    if (isActive && selectedIndustries.length === 1) {
                      setSelectedIndustries([]);
                    } else {
                      setSelectedIndustries([ind]);
                    }
                    updateFilters({ page: 1 });
                  }}
                  className={`px-4 py-1.5 border rounded-full text-gray-600 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] ${
                    isActive
                      ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                  aria-pressed={isActive}
                >
                  {ind}
                </button>
              );
            })}
            {hasIndustryFilter && (
               <button onClick={() => { setSelectedIndustries([]); updateFilters({ page: 1 }); }} className="text-[#3b82f6] text-xs font-bold ml-2 underline">Clear Filter</button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7] flex-grow">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-[#3b82f6]" /> Industry
              </h3>
              <div ref={industryDropdownRef} className="relative">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIndustryOpen((open) => !open)}
                    className="flex-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
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
                        updateFilters({ page: 1 });
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
                              updateFilters({ page: 1 });
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
                          updateFilters({ page: 1 });
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
                              updateFilters({ page: 1 });
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

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-[#3b82f6]" /> Location
              </h3>
              <div ref={locationDropdownRef} className="relative">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLocationOpen((open) => !open)}
                    className="flex-1 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedLocation === "All Locations" ? "All Locations" : selectedLocation}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isLocationOpen ? "rotate-90" : ""}`} />
                  </button>
                  {selectedLocation !== "All Locations" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation("All Locations");
                        setLocationQuery("");
                        updateFilters({ page: 1 });
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
                        <span>{selectedLocation === "All Locations" ? "All Locations" : selectedLocation}</span>
                        {selectedLocation !== "All Locations" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLocation("All Locations");
                              setLocationQuery("");
                              updateFilters({ page: 1 });
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
                          setSelectedLocation("All Locations");
                          setLocationQuery("");
                          updateFilters({ page: 1 });
                          setIsLocationOpen(false);
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
                        const isSelected = selectedLocation === province;
                        return (
                          <button
                            key={province}
                            type="button"
                            onClick={() => {
                              setSelectedLocation(province);
                              setLocationQuery(province);
                              updateFilters({ page: 1 });
                              setIsLocationOpen(false);
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

          </aside>

          <div className="flex-1">
            {/* Featured Employers */}
            {featuredCompaniesForDisplay.length > 0 && !hasAnyFilter && page === 1 && (
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl font-bold">Featured Employers</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredCompaniesForDisplay.map((company) => (
                    <div
                      key={company.id}
                      className="bg-white p-6 rounded-2xl border border-[#3b82f6]/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {company.is_verified && (
                        <div className="absolute top-0 right-0 bg-[#3b82f6]/10 text-[#2563eb] text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                          Verified
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <img
                          src={company.logo || `https://picsum.photos/seed/cp-${company.id}/48/48`}
                          alt={company.company_name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span>{Number(company.rating || 0).toFixed(1)}</span>
                          <span className="text-[10px] font-semibold text-amber-600/70">
                            ({Number(company.rating_count || 0)})
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl mb-1">{company.company_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" /> {company.industry || 'Various'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {company.location || 'Cambodia'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                        {company.description || "Discover opportunities at this top employer."}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-[#3b82f6] font-bold text-sm">
                          {company.open_positions} Open Positions
                        </span>
                        <Link to={`/companies/${company.id}`} className="border border-gray-200 hover:border-[#3b82f6] text-gray-700 hover:text-[#3b82f6] font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                   {loading ? "Searching..." : `${totalFound} Companies found`}
                </h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <Loader2 className="w-10 h-10 animate-spin mb-4" />
                   <p>Loading companies...</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <img
                            src={company.logo || `https://picsum.photos/seed/logo-${company.id}/40/40`}
                            alt={company.company_name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          {company.is_verified && (
                            <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded">
                              VERIFIED
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 mb-2">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span>{Number(company.rating || 0).toFixed(1)}</span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            ({Number(company.rating_count || 0)})
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{company.company_name}</h3>
                        <p className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">
                          {company.industry || 'General'}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                          <MapPin className="w-3.5 h-3.5" /> {company.location || 'Cambodia'}
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                          {company.description || "Leading company in Cambodia offering internship opportunities."}
                        </p>

                        <div className="mt-2 flex flex-col gap-2">
                          <Link
                            to={`/companies/${company.id}`}
                            className="w-full text-center border border-gray-200 hover:border-[#3b82f6] text-gray-700 hover:text-[#3b82f6] font-bold py-2.5 rounded-xl text-sm transition-colors"
                          >
                            View Company Profile
                          </Link>
                          {company.open_positions > 0 ? (
                            <Link
                              to={`/internships?search=${encodeURIComponent(company.company_name)}`}
                              className="w-full text-center bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#2563eb] font-bold py-2.5 rounded-xl text-sm transition-colors"
                            >
                              View {company.open_positions} Openings
                            </Link>
                          ) : (
                            <button className="w-full bg-gray-50 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed">
                              No Current Openings
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button 
                        disabled={page === 1}
                        onClick={() => updateFilters({ page: page - 1 })}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-gray-600 font-medium px-4">
                        Page {page} of {totalPages}
                      </span>
                      <button 
                        disabled={page >= totalPages}
                        onClick={() => updateFilters({ page: page + 1 })}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {!loading && !companies.length && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                  <p className="text-gray-500">No companies found matching your criteria.</p>
                  <button 
                    onClick={() => setSearchParams({})}
                    className="mt-4 text-[#3b82f6] font-bold hover:underline"
                  >
                    Clear all filters
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
