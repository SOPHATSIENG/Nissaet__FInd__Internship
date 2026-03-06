import { Search, MapPin, Building2, Map, Users, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 12,
        search: searchTerm || undefined,
        location: (selectedLocation !== "All Locations" ? selectedLocation : locationTerm) || undefined,
        industry: selectedIndustry || undefined,
      };

      const response = await api.request(`/internships/companies?${new URLSearchParams(params).toString()}`);
      setCompanies(response.companies || []);
    } catch (err) {
      setError("Failed to fetch companies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationTerm, selectedLocation, selectedIndustry]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
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
      {/* Header Section */}
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
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by company name..."
                className="w-full outline-none text-gray-700 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Location"
                className="w-full outline-none text-gray-700 bg-transparent"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
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
                onClick={() => setSelectedIndustry(ind)}
                className={`px-4 py-1.5 border rounded-full cursor-pointer transition-colors ${
                  selectedIndustry === ind
                    ? "bg-[#3b82f6] text-white border-[#3b82f6]"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {ind}
              </span>
            ))}
            {selectedIndustry && (
               <button onClick={() => setSelectedIndustry(null)} className="text-[#3b82f6] text-xs font-bold ml-2">Clear Filter</button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7] flex-grow">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-[#3b82f6]" /> Industry
              </h3>
              <div className="space-y-3">
                {industries.map((ind) => (
                  <label
                    key={ind}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="industry"
                      checked={selectedIndustry === ind}
                      onChange={() => setSelectedIndustry(ind)}
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
                {["All Locations", "Phnom Penh", "Siem Reap", "Remote"].map((loc) => (
                  <label
                    key={loc}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="location"
                      checked={selectedLocation === loc}
                      onChange={() => setSelectedLocation(loc)}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">
                      {loc}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            {/* Featured Employers */}
            {featuredCompanies.length > 0 && (
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

            {/* All Companies List */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                   {loading ? "Searching..." : `${companies.length} Companies found`}
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
                        <Link to={`/internships?search=${company.company_name}`} className="w-full text-center bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#2563eb] font-bold py-2.5 rounded-xl text-sm transition-colors">
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
              )}

              {!loading && !companies.length && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                  <p className="text-gray-500">No companies found matching your criteria.</p>
                  <button 
                    onClick={() => { setSearchTerm(""); setLocationTerm(""); setSelectedLocation("All Locations"); setSelectedIndustry(null); }}
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
