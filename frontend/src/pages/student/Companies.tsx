import { Search, MapPin, Building2, Map, Users, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
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
};

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || "");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  
  const page = parseInt(searchParams.get("page") || "1");
  const industry = searchParams.get("industry") || "all";
  const query = searchParams.get("search") || "";
  const location = searchParams.get("location") || "";
  const totalFound = companies.length;
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
      };
      
      const res = await api.getCompanies(params);
      if (mounted) {
        const items = Array.isArray(res?.companies) ? res.companies : [];
        setAllCompanies(items);
        setCompanies(items);
      }
    } catch (err) {
      if (mounted) setError("Failed to load companies");
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  }, [searchQuery, locationQuery, selectedLocation, selectedIndustries]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    return allCompanies;
  }, [allCompanies]);

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
    setCurrentPage(1);
  };

  const industries = [
    "Technology",
    "Banking",
    "Marketing",
    "Education",
    "Construction",
    "Manufacturing",
  ];

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
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                onChange={(e) => { setLocationQuery(e.target.value); setCurrentPage(1); }}
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
            {industries.slice(0, 4).map((ind) => (
              <span
                key={ind}
                onClick={() => {
                  setSearchQuery(ind);
                  setSelectedIndustries([]);
                  setCurrentPage(1);
                }}
                className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {ind}
              </span>
            ))}
            {industry !== 'all' && (
               <button onClick={() => updateFilters({ industry: 'all' })} className="text-[#3b82f6] text-xs font-bold ml-2 underline">Clear Filter</button>
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
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="industry-filter"
                    checked={industry === 'all'}
                    onChange={() => updateFilters({ industry: 'all' })}
                    className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                  />
                  <span className="text-gray-600 group-hover:text-gray-900">All Industries</span>
                </label>
                {industries.map((ind) => (
                  <label
                    key={ind}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(ind)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIndustries([...selectedIndustries, ind]);
                          else setSelectedIndustries(selectedIndustries.filter(i => i !== ind));
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        {ind}
                      </span>
                    </div>
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
                  { name: "All Locations" },
                  { name: "Phnom Penh" },
                  { name: "Siem Reap" },
                  { name: "Battambang" },
                  { name: "Kompot" },
                  { name: "Remote" },
                ].map((item) => (
                  <label
                    key={item.name}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="location"
                      checked={selectedLocation === item.name}
                      onChange={() => { 
                          setSelectedLocation(item.name); 
                          setLocationQuery(item.name === "All Locations" ? "" : item.name); // Also update input field
                          setCurrentPage(1); 
                        }}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">
                      {item.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#3b82f6]" /> Company Size
              </h3>
              <div className="space-y-3">
                {[
                  "Start-up (1-10)",
                  "Small (11-50)",
                  "Medium (51-200)",
                  "Large (200+)",
                ].map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanySizes.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCompanySizes([...selectedCompanySizes, item]);
                        else setSelectedCompanySizes(selectedCompanySizes.filter(s => s !== item));
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {/* Featured Employers */}
            {featuredCompanies.length > 0 && !query && !location && industry === 'all' && page === 1 && (
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl font-bold">Featured Employers</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="bg-white p-6 rounded-2xl border border-[#3b82f6]/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {company.is_verified && (
                        <div className="absolute top-0 right-0 bg-[#3b82f6]/10 text-[#2563eb] text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                          Verified
                        </div>
                      )}
                      <img
                        src={company.logo || `https://picsum.photos/seed/cp-${company.id}/48/48`}
                        alt={company.company_name}
                        className="w-12 h-12 rounded-xl object-cover mb-4"
                      />
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
                        
                        {company.open_positions > 0 ? (
                          <Link to={`/internships?search=${encodeURIComponent(company.company_name)}`} className="w-full text-center bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#2563eb] font-bold py-2.5 rounded-xl text-sm transition-colors">
                            View {company.open_positions} Openings
                          </Link>
                        ) : (
                          <button className="w-full bg-gray-50 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed">
                            No Current Openings
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalFound > 12 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button 
                        disabled={page === 1}
                        onClick={() => updateFilters({ page: page - 1 })}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-gray-600 font-medium px-4">
                        Page {page} of {Math.ceil(totalFound / 12)}
                      </span>
                      <button 
                        disabled={page >= Math.ceil(totalFound / 12)}
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
