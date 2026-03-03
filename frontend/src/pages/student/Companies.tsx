import { Search, MapPin, Building2, Map, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Companies() {
  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Discover Top Companies
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Explore the best workplaces in Cambodia and find your perfect
            internship match.
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2 max-w-4xl">
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

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
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
                {[
                  { name: "Technology / IT", count: 24 },
                  { name: "Banking & Finance", count: 18 },
                  { name: "Marketing & Media", count: 12 },
                  { name: "Education", count: 8 },
                  { name: "Architecture", count: 5 },
                ].map((item, i) => (
                  <label
                    key={i}
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
                ].map((item, i) => (
                  <label
                    key={i}
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
                ].map((item, i) => (
                  <label
                    key={i}
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

          {/* Results Area */}
          <div className="flex-1">
            {/* Featured Employers */}
            <div className="mb-12">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold">Featured Employers</h2>
                <Link
                  to="#"
                  className="text-[#3b82f6] font-bold hover:underline"
                >
                  View All →
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
                ].map((company, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-[#3b82f6]/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      ★ {company.rating}
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

            {/* All Companies List */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">84 Companies found</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Sort by:</span>
                  <select className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer">
                    <option>Highest Rated</option>
                    <option>Most Openings</option>
                    <option>Newest</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
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
                ].map((company, i) => (
                  <div
                    key={i}
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
                          ★ {company.rating}
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          ★ -
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{company.name}</h3>
                    <p className="text-xs text-gray-400 font-bold tracking-wider mb-2">
                      {company.industry}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" /> {company.location}
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                      {company.desc}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {company.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-50 border border-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {company.openings > 0 ? (
                      <button className="w-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#2563eb] font-bold py-2.5 rounded-xl text-sm transition-colors">
                        View {company.openings} Openings
                      </button>
                    ) : (
                      <button className="w-full bg-gray-50 text-gray-400 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed">
                        No Current Openings
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-12">
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  &lt;
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#3b82f6] text-[#111816] font-bold">
                  1
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                  2
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                  3
                </button>
                <span className="text-gray-400">...</span>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                  8
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
