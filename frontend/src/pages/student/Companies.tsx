<<<<<<< HEAD
import { Search, MapPin, Building2, Map, Users, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

interface Company {
  id: number;
  company_name: string;
  description: string | null;
  logo: string | null;
  industry: string | null;
  location: string | null;
  is_verified: boolean;
  company_size: string | null;
  open_positions: number;
}
=======
import { Search, MapPin, Building2, Map, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
>>>>>>> feature/phat

const allCompanies = [
  {
    name: "Chip Mong Group",
    industry: "CONGLOMERATE",
    location: "Phnom Penh",
    desc: "Diversified business portfolio including construction, consumer...",
    openings: 8,
    rating: 4.5,
    tags: ["Construction", "Retail"],
    logo: "https://picsum.photos/seed/chipmong/40/40",
  },
  {
    name: "Sabay Digital",
    industry: "TECHNOLOGY / MEDIA",
    location: "Phnom Penh",
    desc: "Pioneering digital entertainment and content platform in the...",
    openings: 4,
    rating: 4.2,
    tags: ["Digital Media", "Gaming"],
    logo: "https://picsum.photos/seed/sabay/40/40",
  },
  {
    name: "Mango Tango Asia",
    industry: "CREATIVE AGENCY",
    location: "Siem Reap",
    desc: "Innovative advertising and marketing agency specializing in...",
    openings: 2,
    rating: 4.9,
    tags: ["Advertising", "Design"],
    logo: "https://picsum.photos/seed/mango/40/40",
  },
  {
    name: "KPMG Cambodia",
    industry: "ACCOUNTING / AUDIT",
    location: "Phnom Penh",
    desc: "Global network of professional firms providing Audit, Tax and Advisory...",
    openings: 12,
    rating: 4.7,
    tags: ["Finance", "Audit"],
    logo: "https://picsum.photos/seed/kpmg/40/40",
  },
  {
    name: "Khmer Beverages",
    industry: "MANUFACTURING",
    location: "Phnom Penh",
    desc: "Leading brewery and beverage manufacturer committed to qualit...",
    openings: 0,
    rating: null,
    tags: ["FMCG"],
    logo: "https://picsum.photos/seed/khmerbev/40/40",
  },
  {
    name: "Vattanac Bank",
    industry: "BANKING",
    location: "Phnom Penh",
    desc: "Modern banking services with strong focus on digital customer experience.",
    openings: 6,
    rating: 4.4,
    tags: ["Finance", "Operations"],
    logo: "https://picsum.photos/seed/vattanac/40/40",
  },
  {
    name: "Wing Bank",
    industry: "FINTECH",
    location: "Phnom Penh",
    desc: "Digital financial services and payments platform used nationwide.",
    openings: 7,
    rating: 4.3,
    tags: ["Fintech", "Payments"],
    logo: "https://picsum.photos/seed/wing/40/40",
  },
  {
    name: "KOOMPI",
    industry: "TECHNOLOGY",
    location: "Phnom Penh",
    desc: "Local hardware and software innovation company building digital tools.",
    openings: 3,
    rating: 4.6,
    tags: ["Hardware", "Software"],
    logo: "https://picsum.photos/seed/koompi/40/40",
  },
  {
    name: "CamboJob",
    industry: "HR TECH",
    location: "Phnom Penh",
    desc: "Career and recruitment platform connecting students with employers.",
    openings: 5,
    rating: 4.1,
    tags: ["HR", "Recruitment"],
    logo: "https://picsum.photos/seed/cambojob/40/40",
  },
];

export default function Companies() {
<<<<<<< HEAD
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalFound, setTotalFound] = useState(0);

  // Filter values from URL
  const query = searchParams.get("search") || "";
  const location = searchParams.get("location") || "";
  const industry = searchParams.get("industry") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Local input state
  const [searchInput, setSearchInput] = useState(query);
  const [locationInput, setLocationInput] = useState(location);

  // Sync inputs when URL changes
  useEffect(() => {
    setSearchInput(query);
    setLocationInput(location);
  }, [query, location]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const params: any = {
        limit: 12,
        offset: (page - 1) * 12,
        search: query || undefined,
        location: location || undefined,
        industry: industry !== 'all' ? industry : undefined,
      };

      const response = await api.getCompanies(params);
      setCompanies(response.companies || []);
      setTotalFound(response.total || response.count || 0);
    } catch (err) {
      setError("Failed to fetch companies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, location, industry, page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.getFeaturedCompanies(2);
        setFeaturedCompanies(response.companies || []);
      } catch (err) {
        console.warn("Failed to fetch featured companies");
      }
    };
    fetchFeatured();
  }, []);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    if (!updates.page) {
      newParams.delete("page");
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput, location: locationInput });
  };

  const industries = [
    "Technology",
    "Banking",
    "Marketing",
    "Education",
    "Construction",
    "Manufacturing",
  ];
=======
  const pageSize = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(allCompanies.length / pageSize));

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allCompanies.slice(start, start + pageSize);
  }, [currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | string> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push("ellipsis-left");
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    if (end < totalPages - 1) pages.push("ellipsis-right");

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);
>>>>>>> feature/phat

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

<<<<<<< HEAD
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
=======
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
>>>>>>> feature/phat
            <div className="flex-1 flex items-center px-4 py-2">
              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by company name..."
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
                placeholder="Location"
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
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">
              Top Industries:
            </span>
            {industries.slice(0, 4).map((ind) => (
              <span
                key={ind}
                onClick={() => updateFilters({ industry: ind })}
                className={`px-4 py-1.5 border rounded-full cursor-pointer transition-colors ${
                  industry === ind
                    ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
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
<<<<<<< HEAD
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
=======
                {[
                  { name: "Technology / IT", count: 24 },
                  { name: "Banking & Finance", count: 18 },
                  { name: "Marketing & Media", count: 12 },
                  { name: "Education", count: 8 },
                  { name: "Architecture", count: 5 },
                ].map((item) => (
                  <label
                    key={item.name}
                    className="flex items-center justify-between cursor-pointer group"
>>>>>>> feature/phat
                  >
                    <input
                      type="radio"
                      name="industry-filter"
                      checked={industry === ind}
                      onChange={() => updateFilters({ industry: ind })}
                      className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">
                      {ind}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-[#3b82f6]" /> Location
              </h3>
              <div className="space-y-3">
<<<<<<< HEAD
                {["All Locations", "Phnom Penh", "Siem Reap", "Remote"].map((loc) => (
                  <label
                    key={loc}
=======
                {[
                  { name: "All Locations", checked: true },
                  { name: "Phnom Penh", checked: false },
                  { name: "Siem Reap", checked: false },
                  { name: "Battambang", checked: false },
                ].map((item) => (
                  <label
                    key={item.name}
>>>>>>> feature/phat
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="location-filter"
                      checked={(location === "" && loc === "All Locations") || location === loc}
                      onChange={() => updateFilters({ location: loc === "All Locations" ? "" : loc })}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">
<<<<<<< HEAD
                      {loc}
=======
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
                      className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">
                      {item}
>>>>>>> feature/phat
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
<<<<<<< HEAD
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
=======
            <div className="mb-12">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold">Featured Employers</h2>
                <Link
                  to="#"
                  className="text-[#3b82f6] font-bold hover:underline"
                >
                  View All -&gt;
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    name: "ABA Bank",
                    industry: "Banking",
                    location: "Phnom Penh",
                    desc: "Leading financial institution in Cambodia focused on digital innovation and modern banking solutions.",
                    openings: 5,
                    rating: 4.8,
                    logo: "https://picsum.photos/seed/aba/48/48",
                  },
                  {
                    name: "Smart Axiata",
                    industry: "Telecommunications",
                    location: "Phnom Penh",
                    desc: "Connecting people and businesses across Cambodia with advanced mobile technology.",
                    openings: 3,
                    rating: 4.6,
                    logo: "https://picsum.photos/seed/smart/48/48",
                  },
                ].map((company) => (
                  <div
                    key={company.name}
                    className="bg-white p-6 rounded-2xl border border-[#3b82f6]/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      ? {company.rating}
                    </div>
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-xl object-cover mb-4"
                    />
                    <h3 className="font-bold text-xl mb-1">{company.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {company.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {company.location}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                      {company.desc}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-[#3b82f6] font-bold text-sm">
                        {company.openings} Open Positions
                      </span>
                      <button className="border border-gray-200 hover:border-[#3b82f6] text-gray-700 hover:text-[#3b82f6] font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
>>>>>>> feature/phat

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

<<<<<<< HEAD
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
=======
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCompanies.map((company) => (
                  <div
                    key={company.name}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      {company.rating ? (
                        <div className="bg-yellow-50 text-yellow-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          ? {company.rating}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          ? -
>>>>>>> feature/phat
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

<<<<<<< HEAD
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
=======
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <span aria-hidden="true">&lt;</span>
                </button>
                {visiblePages.map((page) => {
                  if (typeof page !== "number") {
                    return (
                      <span key={page} className="px-1 text-gray-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                        isActive
                          ? "bg-[#3b82f6] text-[#111816] font-bold"
                          : "hover:bg-gray-100 text-gray-700"
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
                  <span className="sr-only">Next</span>
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>
>>>>>>> feature/phat
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
