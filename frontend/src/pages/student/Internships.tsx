import {
  Search,
  MapPin,
  Code,
  Map,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

type Internship = {
  id: number;
  title: string;
  company_name: string;
  location: string;
  stipend: number;
  stipend_currency: string;
  type: string;
  status: string;
  is_remote: boolean;
  is_hybrid: boolean;
  work_mode: string;
  company_logo: string | null;
  created_at: string;
  is_new?: boolean;
};

export default function Internships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [recommendations, setRecommendations] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [compFilter, setCompFilter] = useState("All"); // All, Paid, Unpaid
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [page, setPage] = useState(1);
  const [totalFound, setTotalFound] = useState(0);

  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 10,
        offset: (page - 1) * 10,
        search: searchTerm || undefined,
        location: (selectedLocation !== "All Locations" ? selectedLocation : locationTerm) || undefined,
      };

      if (compFilter === "Paid") {
        params.min_stipend = 1;
      } else if (compFilter === "Unpaid") {
        params.max_stipend = 0;
      }

      const response = await api.getInternships(params);
      setInternships(response.internships || []);
      setTotalFound(response.count || (response.internships?.length || 0));
    } catch (err) {
      setError("Failed to fetch internships. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationTerm, selectedLocation, compFilter, page]);

  const fetchRecommendations = async () => {
    try {
      const response = await api.getRecommendedInternships();
      setRecommendations(response.internships || []);
    } catch (err) {
      // Silently fail for recommendations if not logged in
      console.warn("Could not fetch recommendations");
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInternships();
  };

  const salaryText = (job: Internship) => {
    if (!job.stipend || job.stipend === 0) return "Unpaid";
    return `${job.stipend_currency || '$'}${job.stipend}/mo`;
  };

  const getPostedTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Today";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Dream Internship</h1>
          <p className="text-lg text-gray-500 mb-8">Kickstart your career with the best opportunities in Cambodia.</p>

          <form onSubmit={handleSearch} className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
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
                placeholder="Phnom Penh, Cambodia"
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
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">Popular:</span>
            {["Frontend Developer", "Marketing Intern", "UI/UX Designer", "Accounting"].map((tag) => (
              <span
                key={tag}
                onClick={() => { setSearchTerm(tag); setPage(1); }}
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
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-[#3b82f6]" /> Location
              </h3>
              <div className="space-y-3">
                {["All Locations", "Phnom Penh", "Siem Reap", "Remote"].map((loc) => (
                  <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="location"
                      checked={selectedLocation === loc}
                      onChange={() => { setSelectedLocation(loc); setPage(1); }}
                      className="w-4 h-4 text-[#3b82f6] focus:ring-[#3b82f6]"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900">{loc}</span>
                  </label>
                ))}
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
                    onClick={() => { setCompFilter(item); setPage(1); }}
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
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl font-bold">Recommended for you</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {recommendations.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-bl-full -z-10"></div>
                      <div className="flex items-start gap-4 mb-4">
                        <img 
                          src={job.company_logo || `https://picsum.photos/seed/cp-${job.id}/48/48`} 
                          alt={job.company_name} 
                          className="w-12 h-12 rounded-xl object-cover" 
                        />
                        <div>
                          <Link
                            to={`/internships/${job.id}`}
                            className="font-bold text-lg leading-tight hover:text-[#3b82f6] transition-colors"
                          >
                            {job.title}
                          </Link>
                          <p className="text-gray-500 text-sm">
                            {job.company_name} | {job.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-6">
                        <span className="bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-md font-medium">
                          {job.work_mode}
                        </span>
                        <span className="bg-gray-50 text-gray-600 text-xs px-3 py-1.5 rounded-md font-medium">
                          {salaryText(job)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-gray-400 text-xs">Posted {getPostedTime(job.created_at)}</span>
                        <Link to={`/internships/${job.id}`} className="text-[#3b82f6] font-bold text-sm hover:underline">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Internships Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {loading ? "Searching..." : `${totalFound} Internships found`}
                </h2>
              </div>

              {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p>Finding the best opportunities for you...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {internships.map((job) => (
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
                            <Link
                              to={`/internships/${job.id}`}
                              className="font-bold text-lg hover:text-[#3b82f6] transition-colors"
                            >
                              {job.title}
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" /> {job.company_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" /> {salaryText(job)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-md">
                              {job.work_mode}
                            </span>
                            <span className="bg-gray-50 text-gray-500 text-xs px-2.5 py-1 rounded-md capitalize">
                              {job.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-3 justify-end items-center md:items-stretch border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                        <Link
                          to={`/internships/${job.id}`}
                          className="flex-1 md:flex-none bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] font-bold px-6 py-2.5 rounded-xl transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gray-50 text-gray-600 hover:bg-gray-100">
                          <Bookmark className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {!internships.length && (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                      <p className="text-gray-500">No internships found matching your criteria.</p>
                      <button 
                        onClick={() => { setSearchTerm(""); setLocationTerm(""); setSelectedLocation("All Locations"); setCompFilter("All"); }}
                        className="mt-4 text-[#3b82f6] font-bold hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalFound > 10 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-600 font-medium px-4">
                    Page {page} of {Math.ceil(totalFound / 10)}
                  </span>
                  <button 
                    disabled={page >= Math.ceil(totalFound / 10)}
                    onClick={() => setPage(p => p + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
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
