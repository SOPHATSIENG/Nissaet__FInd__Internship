import { Search, MapPin, Building2, Map, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

type CompanyApiItem = {
  id: number;
  company_name: string;
  description: string;
  logo: string | null;
  location: string;
  open_positions: number;
};

export default function Companies() {
  const pageSize = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<CompanyApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const totalPages = Math.max(1, Math.ceil(companies.length / pageSize));

  useEffect(() => {
    let mounted = true;

    const loadCompanies = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.getFeaturedCompanies(50); // Get more companies for pagination
        const items = Array.isArray(res?.companies) ? res.companies : [];
        if (mounted) {
          setCompanies(items);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load companies");
        setCompanies([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCompanies();
    return () => {
      mounted = false;
    };
  }, []);

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return companies.slice(start, start + pageSize);
  }, [companies, currentPage]);

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

          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto text-left">
            <div className="flex-1 flex items-center px-4 py-2">
              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by company name..."
                className="w-full outline-none text-gray-700 bg-transparent"
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>
            <div className="flex-1 flex items-center px-4 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Location"
                className="w-full outline-none text-gray-700 bg-transparent"
              />
            </div>
            <button className="bg-[#111816] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-colors w-full md:w-auto">
              Search
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">
              Top Industries:
            </span>
            {[
              "Technology",
              "Banking & Finance",
              "Digital Marketing",
              "NGO",
            ].map((ind) => (
              <span
                key={ind}
                className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                {ind}
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
                <Building2 className="w-5 h-5 text-[#3b82f6]" /> Industry
              </h3>
              <div className="space-y-3">
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
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                      />
                      <span className="text-gray-600 group-hover:text-gray-900">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      {item.count}
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
                {[
                  { name: "All Locations", checked: true },
                  { name: "Phnom Penh", checked: false },
                  { name: "Siem Reap", checked: false },
                  { name: "Battambang", checked: false },
                ].map((item) => (
                  <label
                    key={item.name}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="location"
                      defaultChecked={item.checked}
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
                {companies.slice(0, 2).map((company) => (
                  <div
                    key={company.id}
                    className="bg-white p-6 rounded-2xl border border-[#3b82f6]/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      ? {company.open_positions} Openings
                    </div>
                    <img
                      src={company.logo || `https://picsum.photos/seed/company-${company.id}/48/48`}
                      alt={company.company_name}
                      className="w-12 h-12 rounded-xl object-cover mb-4"
                    />
                    <h3 className="font-bold text-xl mb-1">{company.company_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {company.location}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                      {company.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-[#3b82f6] font-bold text-sm">
                        {company.open_positions} Internship Positions
                      </span>
                      <button className="border border-gray-200 hover:border-[#3b82f6] text-gray-700 hover:text-[#3b82f6] font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {loading ? "Loading companies..." : `${companies.length} Companies found`}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Sort by:</span>
                  <select className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer">
                    <option>Most Openings</option>
                    <option>Name A-Z</option>
                    <option>Newest</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mb-8 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!loading && companies.length === 0 ? (
                  <div className="col-span-full bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                    No companies found.
                  </div>
                ) : (
                  paginatedCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <img
                          src={company.logo || `https://picsum.photos/seed/company-${company.id}/40/40`}
                          alt={company.company_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="bg-yellow-50 text-yellow-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          ? {company.open_positions}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{company.company_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <MapPin className="w-3.5 h-3.5" /> {company.location}
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                        {company.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="bg-gray-50 border border-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">
                          {company.open_positions} Internship Positions
                        </span>
                      </div>
                      {company.open_positions > 0 ? (
                        <button className="w-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#2563eb] font-bold py-2.5 rounded-xl text-sm transition-colors">
                          View {company.open_positions} Openings
                        </button>
                      ) : (
                        <button className="w-full bg-gray-50 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed">
                          No Current Openings
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
