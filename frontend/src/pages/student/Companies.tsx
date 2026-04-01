import {
  Search,
  MapPin,
  Building2,
  Map,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Star,
} from "lucide-react";
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
}

/* ─── tiny Win2k bevel helpers ─────────────────────────────────── */
const raisedBorder =
  "border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]";
const sunkenBorder =
  "border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]";

function Win2kButton({
  children,
  onClick,
  disabled,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`
        inline-flex items-center justify-center gap-1
        border-2 border-solid
        ${raisedBorder}
        bg-[#d4d0c8] text-[#000000] text-[11px] font-bold
        px-3 py-0.5 min-w-[75px] h-[23px]
        active:border-t-[#808080] active:border-l-[#808080] active:border-b-[#ffffff] active:border-r-[#ffffff]
        disabled:opacity-50 disabled:cursor-default
        cursor-default select-none
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function Win2kInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`
        border-2 border-solid
        ${sunkenBorder}
        bg-[#ffffff] text-[#000000] text-[11px]
        px-1.5 py-0.5 h-[21px]
        outline-none
        ${className}
      `}
    />
  );
}

function TitleBar({ title }: { title: string }) {
  return (
    <div
      className="flex items-center justify-between px-2 h-[18px] select-none"
      style={{
        background: "linear-gradient(90deg, #0a246a 0%, #a6caf0 100%)",
      }}
    >
      <span className="text-white text-[11px] font-bold tracking-wide">{title}</span>
      <div className="flex items-center gap-px">
        {["_", "□", "✕"].map((c) => (
          <span
            key={c}
            className="
              flex items-center justify-center
              w-[16px] h-[14px]
              border-2 border-solid
              border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]
              bg-[#d4d0c8] text-[#000000] text-[9px] font-bold leading-none
              cursor-default
            "
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function Win2kPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-2 border-solid border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] bg-[#d4d0c8] ${className}`}
    >
      {title && (
        <div className="border-b-2 border-solid border-b-[#808080] border-t-[#ffffff]">
          <TitleBar title={title} />
        </div>
      )}
      <div className="p-2">{children}</div>
    </div>
  );
}

function StatusBar({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1 border-t border-[#808080] bg-[#d4d0c8] px-2 py-0.5">
      <div
        className="flex-1 border border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] px-1"
      >
        <span className="text-[10px] text-[#000000]">{text}</span>
      </div>
    </div>
  );
}

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationQuery, setLocationQuery] = useState(searchParams.get("location") || "");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industryQuery, setIndustryQuery] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [locationQueryFilter, setLocationQueryFilter] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const totalFound = companies.length;
  const featuredCompanies: Company[] = [];

  const loadCompanies = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      setError("");
      const params = {
        search: searchQuery,
        location: selectedLocation === "All Locations" ? locationQuery : selectedLocation,
        industries: selectedIndustries.length > 0 ? selectedIndustries.join(",") : undefined,
      };
      const res = await api.getCompanies(params);
      if (mounted) {
        const items = Array.isArray(res?.companies) ? res.companies : [];
        setAllCompanies(items);
        setCompanies(items);
      }
    } catch {
      if (mounted) setError("Failed to load companies");
    } finally {
      if (mounted) setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [searchQuery, locationQuery, selectedLocation, selectedIndustries]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => allCompanies, [allCompanies]);

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

  const featuredCompaniesForDisplay = useMemo(() => {
    if (featuredCompanies.length > 0) return featuredCompanies;
    return companies.slice(0, 2);
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
  const hasLocationFilter =
    Boolean(locationQuery.trim()) || selectedLocation !== "All Locations";
  const hasAnyFilter = hasIndustryFilter || hasSearchFilter || hasLocationFilter;

  const cambodiaProvinces = [
    "Phnom Penh","Banteay Meanchey","Battambang","Kampong Cham","Kampong Chhnang",
    "Kampong Speu","Kampong Thom","Kampot","Kandal","Kep","Koh Kong","Kratie",
    "Mondulkiri","Oddar Meanchey","Pailin","Preah Vihear","Prey Veng","Pursat",
    "Ratanakiri","Siem Reap","Preah Sihanouk","Stung Treng","Svay Rieng","Takeo",
    "Tbong Khmum","Remote",
  ];

  const filteredIndustries = useMemo(() => {
    const query = industryQuery.trim().toLowerCase();
    if (!query) return industries;
    return industries.filter((i) => i.toLowerCase().includes(query));
  }, [industryQuery]);

  const filteredLocations = useMemo(() => {
    const query = locationQueryFilter.trim().toLowerCase();
    if (!query) return cambodiaProvinces;
    return cambodiaProvinces.filter((p) => p.toLowerCase().includes(query));
  }, [locationQueryFilter]);

  useEffect(() => {
    if (!isIndustryOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!industryDropdownRef.current) return;
      if (!industryDropdownRef.current.contains(event.target as Node))
        setIsIndustryOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setIsIndustryOpen(false); };
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
      if (!locationDropdownRef.current.contains(event.target as Node))
        setIsLocationOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setIsLocationOpen(false); };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isLocationOpen]);

  /* ─── paged slice ───────────────────────────────────────────── */
  const pagedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return companies.slice(start, start + pageSize);
  }, [companies, currentPage]);

  const totalPages = Math.ceil(totalFound / pageSize);

  return (
    /* outer window chrome */
    <div
      className="flex flex-col"
      style={{ fontFamily: "Tahoma, Arial, sans-serif", fontSize: "11px", color: "#000000" }}
    >
      {/* ── Top toolbar band ─────────────────────────────────────── */}
      <div
        className="border-b-2 border-[#808080]"
        style={{ background: "#d4d0c8" }}
      >
        {/* Menu bar */}
        <div className="flex items-center gap-0 border-b border-[#808080] px-2 h-[20px]">
          {["File", "Edit", "View", "Favorites", "Tools", "Help"].map((m) => (
            <span
              key={m}
              className="px-2 h-full flex items-center text-[11px] cursor-default hover:bg-[#0a246a] hover:text-white"
            >
              {m}
            </span>
          ))}
        </div>

        {/* Address / search toolbar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 px-2 py-1">
          <span className="text-[11px] font-bold shrink-0">Address</span>
          <div
            className="flex-1 flex items-center gap-1 border-2 border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] bg-white px-1 h-[21px]"
          >
            <Building2 className="w-3 h-3 text-gray-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by company name..."
              className="flex-1 outline-none text-[11px] bg-transparent text-black"
            />
          </div>
          <div
            className="flex items-center gap-1 border-2 border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] bg-white px-1 h-[21px] w-40"
          >
            <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => { setLocationQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Location..."
              className="flex-1 outline-none text-[11px] bg-transparent text-black"
            />
          </div>
          <Win2kButton type="submit">
            <Search className="w-3 h-3" /> Go
          </Win2kButton>
          {hasAnyFilter && (
            <Win2kButton
              onClick={() => {
                setSearchQuery("");
                setLocationQuery("");
                setSelectedIndustries([]);
                setSelectedLocation("All Locations");
                setSearchParams({});
                setCurrentPage(1);
              }}
            >
              <X className="w-3 h-3" /> Clear
            </Win2kButton>
          )}
        </form>

        {/* Quick industry pill buttons */}
        <div className="flex items-center gap-1 px-2 pb-1 flex-wrap">
          <span className="text-[10px] text-[#444] mr-1 font-bold">Industries:</span>
          {industries.slice(0, 5).map((ind) => {
            const isActive = selectedIndustries.includes(ind);
            return (
              <button
                key={ind}
                type="button"
                onClick={() => {
                  setSelectedIndustries(isActive ? [] : [ind]);
                  setCurrentPage(1);
                }}
                className={`
                  text-[10px] px-2 h-[18px] border-2 border-solid cursor-default select-none
                  ${isActive
                    ? "border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] bg-[#d4d0c8] font-bold"
                    : "border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] bg-[#d4d0c8]"
                  }
                `}
                aria-pressed={isActive}
              >
                {ind}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main content area ──────────────────────────────────────── */}
      <div
        className="flex flex-col lg:flex-row gap-2 p-2 flex-grow"
        style={{ background: "#d4d0c8", minHeight: "calc(100vh - 80px)" }}
      >
        {/* ── LEFT PANEL – Filters ───────────────────────────────── */}
        <aside className="w-full lg:w-[180px] flex-shrink-0 flex flex-col gap-2">

          {/* Industry filter panel */}
          <Win2kPanel title="Filter - Industry">
            <div ref={industryDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsIndustryOpen((o) => !o)}
                className="
                  w-full flex items-center justify-between
                  border-2 border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]
                  bg-white text-[11px] text-black px-1 h-[21px]
                  cursor-default
                "
              >
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-500" />
                  {selectedIndustries.length === 0
                    ? "All Industries"
                    : selectedIndustries.length === 1
                      ? selectedIndustries[0]
                      : `${selectedIndustries.length} selected`}
                </span>
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${isIndustryOpen ? "rotate-90" : ""}`}
                />
              </button>

              {isIndustryOpen && (
                <div
                  className="absolute z-20 top-full left-0 w-full border-2 border-solid border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]"
                  style={{ background: "#d4d0c8" }}
                >
                  <div className="p-1 border-b border-[#808080]">
                    <Win2kInput
                      value={industryQuery}
                      onChange={(e) => setIndustryQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full"
                    />
                    {selectedIndustries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedIndustries([]); setCurrentPage(1); }}
                        className="text-[10px] text-[#0000ee] underline cursor-pointer mt-0.5"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedIndustries([]); setCurrentPage(1); setIsIndustryOpen(false); }}
                      className="w-full text-left px-2 py-0.5 text-[11px] hover:bg-[#0a246a] hover:text-white cursor-default"
                    >
                      All Industries
                    </button>
                    {filteredIndustries.map((industry) => {
                      const isSelected = selectedIndustries.includes(industry);
                      return (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => {
                            setSelectedIndustries(
                              isSelected
                                ? selectedIndustries.filter((i) => i !== industry)
                                : [...selectedIndustries, industry]
                            );
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-2 py-0.5 text-[11px] flex items-center justify-between hover:bg-[#0a246a] hover:text-white cursor-default ${isSelected ? "font-bold" : ""}`}
                        >
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 border border-[#808080] inline-block ${isSelected ? "bg-[#0a246a]" : "bg-white"}`} />
                            {industry}
                          </span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {selectedIndustries.length > 0 && (
              <Win2kButton
                onClick={() => { setSelectedIndustries([]); setCurrentPage(1); }}
                className="mt-1 w-full"
              >
                <X className="w-3 h-3" /> Clear
              </Win2kButton>
            )}
          </Win2kPanel>

          {/* Location filter panel */}
          <Win2kPanel title="Filter - Location">
            <div ref={locationDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsLocationOpen((o) => !o)}
                className="
                  w-full flex items-center justify-between
                  border-2 border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff]
                  bg-white text-[11px] text-black px-1 h-[21px]
                  cursor-default
                "
              >
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  {selectedLocation === "All Locations" ? "All Locations" : selectedLocation}
                </span>
                <ChevronRight className={`h-3 w-3 transition-transform ${isLocationOpen ? "rotate-90" : ""}`} />
              </button>

              {isLocationOpen && (
                <div
                  className="absolute z-20 top-full left-0 w-full border-2 border-solid border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]"
                  style={{ background: "#d4d0c8" }}
                >
                  <div className="p-1 border-b border-[#808080]">
                    <Win2kInput
                      value={locationQueryFilter}
                      onChange={(e) => setLocationQueryFilter(e.target.value)}
                      placeholder="Search..."
                      className="w-full"
                    />
                    {selectedLocation !== "All Locations" && (
                      <button
                        type="button"
                        onClick={() => { setSelectedLocation("All Locations"); setLocationQuery(""); setCurrentPage(1); }}
                        className="text-[10px] text-[#0000ee] underline cursor-pointer mt-0.5"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedLocation("All Locations"); setLocationQuery(""); setCurrentPage(1); setIsLocationOpen(false); }}
                      className="w-full text-left px-2 py-0.5 text-[11px] hover:bg-[#0a246a] hover:text-white cursor-default"
                    >
                      All Locations
                    </button>
                    {filteredLocations.map((province) => {
                      const isSelected = selectedLocation === province;
                      return (
                        <button
                          key={province}
                          type="button"
                          onClick={() => { setSelectedLocation(province); setLocationQuery(province); setCurrentPage(1); setIsLocationOpen(false); }}
                          className={`w-full text-left px-2 py-0.5 text-[11px] flex items-center justify-between hover:bg-[#0a246a] hover:text-white cursor-default ${isSelected ? "font-bold" : ""}`}
                        >
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 border border-[#808080] inline-block ${isSelected ? "bg-[#0a246a]" : "bg-white"}`} />
                            {province}
                          </span>
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {selectedLocation !== "All Locations" && (
              <Win2kButton
                onClick={() => { setSelectedLocation("All Locations"); setLocationQuery(""); setCurrentPage(1); }}
                className="mt-1 w-full"
              >
                <X className="w-3 h-3" /> Clear
              </Win2kButton>
            )}
          </Win2kPanel>

          {/* help / tip box */}
          <Win2kPanel title="Tips">
            <p className="text-[10px] leading-relaxed text-[#000]">
              Use the search bar above to find companies by name or location. Filter results using the panels on the left.
            </p>
          </Win2kPanel>
        </aside>

        {/* ── RIGHT PANEL – Results ──────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">

          {/* Featured window */}
          {featuredCompaniesForDisplay.length > 0 && !hasAnyFilter && page === 1 && (
            <Win2kPanel title="⭐ Featured Employers">
              <div className="grid md:grid-cols-2 gap-2">
                {featuredCompaniesForDisplay.map((company) => (
                  <div
                    key={company.id}
                    className="
                      border-2 border-solid border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]
                      bg-[#d4d0c8] p-2 relative
                    "
                  >
                    {company.is_verified && (
                      <div
                        className="absolute top-0 right-0 px-1 text-[9px] font-bold text-white"
                        style={{ background: "#0a246a" }}
                      >
                        ✓ VERIFIED
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={company.logo || `https://picsum.photos/seed/cp-${company.id}/32/32`}
                        alt={company.company_name}
                        className="w-8 h-8 object-cover border border-[#808080]"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <h3 className="font-bold text-[12px]">{company.company_name}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-[#444]">
                          <Building2 className="w-3 h-3" /> {company.industry || "Various"}
                          <MapPin className="w-3 h-3 ml-1" /> {company.location || "Cambodia"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-700 mb-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {Number(company.rating || 0).toFixed(1)} ({Number(company.rating_count || 0)})
                    </div>
                    <p className="text-[10px] text-[#333] mb-2 line-clamp-2">
                      {company.description || "Discover opportunities at this top employer."}
                    </p>
                    <div className="flex items-center justify-between border-t border-[#808080] pt-1">
                      <span className="text-[10px] font-bold" style={{ color: "#0a246a" }}>
                        {company.open_positions} Open Position{company.open_positions !== 1 ? "s" : ""}
                      </span>
                      <Link to={`/companies/${company.id}`}>
                        <Win2kButton>View Profile</Win2kButton>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Win2kPanel>
          )}

          {/* Results window */}
          <div
            className="
              border-2 border-solid border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]
              bg-[#d4d0c8] flex flex-col flex-1
            "
          >
            {/* title bar */}
            <div className="border-b-2 border-solid border-b-[#808080] border-t-[#ffffff]">
              <TitleBar
                title={
                  loading
                    ? "Searching... — Companies"
                    : `${totalFound} Companies found — Browse Results`
                }
              />
            </div>

            {/* toolbar row */}
            <div className="flex items-center gap-1 border-b border-[#808080] px-2 py-0.5 bg-[#d4d0c8]">
              <Win2kButton onClick={loadCompanies}>
                <Search className="w-3 h-3" /> Refresh
              </Win2kButton>
              {hasAnyFilter && (
                <Win2kButton
                  onClick={() => {
                    setSearchQuery(""); setLocationQuery("");
                    setSelectedIndustries([]); setSelectedLocation("All Locations");
                    setSearchParams({}); setCurrentPage(1);
                  }}
                >
                  <X className="w-3 h-3" /> Reset Filters
                </Win2kButton>
              )}
              <div
                className="ml-auto border border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] px-2 h-[18px] flex items-center"
              >
                <span className="text-[10px]">
                  {totalFound} items | Page {currentPage} of {Math.max(1, totalPages)}
                </span>
              </div>
            </div>

            {/* body */}
            <div className="p-2 flex-1">
              {error && (
                <div className="flex items-center gap-2 border-2 border-solid border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] bg-[#fff0f0] p-2 mb-2">
                  <AlertCircle size={14} className="text-red-600" />
                  <span className="text-[11px] text-red-700">{error}</span>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#444]">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-[11px]">Loading companies, please wait…</p>
                </div>
              ) : companies.length === 0 ? (
                <div className="border-2 border-dashed border-[#808080] p-8 text-center">
                  <p className="text-[11px] text-[#555]">No companies found matching your criteria.</p>
                  <button
                    onClick={() => setSearchParams({})}
                    className="mt-2 text-[11px] text-[#0000ee] underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Company cards grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {pagedCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="
                          border-2 border-solid border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080]
                          bg-white flex flex-col
                        "
                      >
                        {/* card title bar */}
                        <div
                          className="flex items-center gap-1 px-1 h-[16px]"
                          style={{
                            background: "linear-gradient(90deg, #0a246a 0%, #a6caf0 100%)",
                          }}
                        >
                          <Building2 className="w-2.5 h-2.5 text-white shrink-0" />
                          <span className="text-white text-[9px] font-bold truncate">{company.company_name}</span>
                          {company.is_verified && (
                            <span className="ml-auto text-[8px] text-yellow-300 font-bold shrink-0">✓ VERIFIED</span>
                          )}
                        </div>

                        {/* card body */}
                        <div className="p-2 flex flex-col flex-1">
                          <div className="flex items-start gap-2 mb-1">
                            <img
                              src={company.logo || `https://picsum.photos/seed/logo-${company.id}/32/32`}
                              alt={company.company_name}
                              className="w-8 h-8 object-cover border border-[#808080] shrink-0"
                              crossOrigin="anonymous"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold truncate">{company.company_name}</p>
                              <p className="text-[10px] text-[#555] uppercase">{company.industry || "General"}</p>
                              <div className="flex items-center gap-1 text-[10px] text-[#555]">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="truncate">{company.location || "Cambodia"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-amber-700 mb-1">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            <span>{Number(company.rating || 0).toFixed(1)}</span>
                            <span className="text-[#888]">({Number(company.rating_count || 0)})</span>
                          </div>

                          <p className="text-[10px] text-[#333] mb-2 line-clamp-2 flex-grow border-t border-[#e0e0e0] pt-1">
                            {company.description || "Leading company in Cambodia offering internship opportunities."}
                          </p>

                          {/* card buttons */}
                          <div className="flex flex-col gap-1 border-t border-[#808080] pt-1.5 mt-auto">
                            <Link to={`/companies/${company.id}`} className="w-full">
                              <Win2kButton className="w-full">
                                <Building2 className="w-3 h-3" /> View Profile
                              </Win2kButton>
                            </Link>
                            {company.open_positions > 0 ? (
                              <Link
                                to={`/internships?search=${encodeURIComponent(company.company_name)}`}
                                className="w-full"
                              >
                                <Win2kButton className="w-full" style={{ background: "#d4e8ff" }}>
                                  <Search className="w-3 h-3" /> {company.open_positions} Opening{company.open_positions !== 1 ? "s" : ""}
                                </Win2kButton>
                              </Link>
                            ) : (
                              <Win2kButton disabled className="w-full opacity-50">
                                No Openings
                              </Win2kButton>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-[#808080]">
                      <Win2kButton
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-3 h-3" /> Back
                      </Win2kButton>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                        .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "…" ? (
                            <span key={`ellipsis-${idx}`} className="text-[11px] px-1">…</span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setCurrentPage(item as number)}
                              className={`
                                w-[26px] h-[23px] text-[11px] border-2 border-solid cursor-default
                                ${currentPage === item
                                  ? "border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] font-bold bg-[#d4d0c8]"
                                  : "border-t-[#ffffff] border-l-[#ffffff] border-b-[#808080] border-r-[#808080] bg-[#d4d0c8]"
                                }
                              `}
                            >
                              {item}
                            </button>
                          )
                        )}
                      <Win2kButton
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next <ChevronRight className="w-3 h-3" />
                      </Win2kButton>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status bar */}
            <StatusBar
              text={
                loading
                  ? "Fetching data from server…"
                  : error
                    ? `Error: ${error}`
                    : `${totalFound} object(s) — Nissaet Company Browser v1.0`
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
