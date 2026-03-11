import {
  Search,
  MapPin,
  SearchIcon,
  Send,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

interface FeaturedCompany {
  id: number;
  company_name: string;
  description: string | null;
  open_positions: number;
  rating: number | null;
  logo: string | null;
}

interface Internship {
  id: number;
  title: string;
  company_name: string;
  location: string;
  description?: string;
  requirements?: string;
  salary_type: string;
  salary_min: number | null;
  salary_max: number | null;
  work_mode: string;
  company_logo: string | null;
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SKILL_ALIASES: Record<string, string[]> = {
  frontend: ["frontend", "front end", "react", "javascript", "typescript", "html", "css", "ui", "ux"],
  python: ["python", "django", "flask", "fastapi", "pandas"],
};

const hasPhrase = (target: string, phrase: string) =>
  ` ${target} `.includes(` ${normalizeText(phrase)} `);

const matchesSkill = (target: string, skill: string) => {
  const normalizedSkill = normalizeText(skill);
  const aliases = SKILL_ALIASES[normalizedSkill] || [normalizedSkill];
  return aliases.some((alias) => hasPhrase(target, alias));
};

export default function Home() {
  const [featuredCompanies, setFeaturedCompanies] = useState<FeaturedCompany[]>([]);
  const [latestInternships, setLatestInternships] = useState<Internship[]>([]);
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        const [companiesRes, internshipsRes, profileRes] = await Promise.all([
          api.getFeaturedCompanies(4),
          api.getInternships({ limit: 100 }),
          api.getProfileSettings().catch(() => null),
        ]);

        if (!isMounted) {
          return;
        }

        setFeaturedCompanies(companiesRes.companies || []);
        setLatestInternships(internshipsRes.internships || []);
        setProfileSkills(
          Array.isArray(profileRes?.settings?.skills)
            ? profileRes.settings.skills
                .map((skill: { name?: string }) => (skill?.name || "").trim().toLowerCase())
                .filter(Boolean)
            : []
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load dashboard data."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const companiesForDisplay = useMemo(() => featuredCompanies.slice(0, 4), [featuredCompanies]);
  const internshipsForDisplay = useMemo(() => {
    if (!profileSkills.length) {
      return [];
    }

    return latestInternships
      .filter((job) => {
        const target = normalizeText(
          `${job.title} ${job.description || ""} ${job.requirements || ""}`
        );
        return profileSkills.some((skill) => matchesSkill(target, skill));
      })
      .slice(0, 4);
  }, [latestInternships, profileSkills]);

  const salaryText = (item: Internship) => {
    if (item.salary_type === "unpaid") {
      return "Unpaid";
    }
    if (item.salary_min && item.salary_max) {
      return `$${item.salary_min} - $${item.salary_max}`;
    }
    if (item.salary_min) {
      return `$${item.salary_min}+`;
    }
    return item.salary_type === "stipend" ? "Stipend" : "Paid";
  };

  return (
    <div className="flex flex-col">
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Launch Your Career with the <br />
            Best <span className="text-[#3b82f6]">Internships</span> in Cambodia
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Connect with top companies, gain real-world experience, and build
            your professional network on Nissaet.
          </p>

          <div className="bg-white p-2 rounded-full shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="What internship are you looking for?"
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
            <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] font-bold px-8 py-3 rounded-full transition-colors w-full md:w-auto">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7]">
        <div className="max-w-[1440px] mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">How Nissaet Works</h2>
          <p className="text-gray-500 mb-12">
            Simple steps to land your dream internship.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: SearchIcon,
                title: "1. Find Internships",
                desc: "Browse verified opportunities from top companies.",
              },
              {
                icon: Send,
                title: "2. Apply Easily",
                desc: "Create your profile once and apply in a few clicks.",
              },
              {
                icon: CheckCircle2,
                title: "3. Get Hired",
                desc: "Connect with employers and start your career.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center"
              >
                <div className="w-16 h-16 bg-[#3b82f6]/10 text-[#3b82f6] rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Companies</h2>
              <p className="text-gray-500">
                Top rated employers looking for student talent.
              </p>
            </div>
            <Link
              to="/companies"
              className="text-[#3b82f6] font-bold flex items-center hover:underline"
            >
              View All Companies <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {error && (
            <p className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="grid md:grid-cols-4 gap-6">
            {companiesForDisplay.map((company) => (
              <div
                key={company.id}
                className="bg-[#f6f8f7] p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <img
                    src={company.logo || `https://picsum.photos/seed/company-${company.id}/40/40`}
                    alt={company.company_name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex items-center bg-white px-2 py-1 rounded text-sm font-bold text-yellow-600 shadow-sm">
                    Rating: {company.rating || 0}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{company.company_name}</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                  {company.description || "Verified company looking for internship talent."}
                </p>
                <div className="inline-block bg-[#3b82f6]/10 text-[#2563eb] text-xs font-bold px-3 py-1.5 rounded-full">
                  {company.open_positions} Open Internships
                </div>
              </div>
            ))}
          </div>
          {!loading && !companiesForDisplay.length && (
            <p className="text-sm text-gray-500 mt-4">No featured companies available yet.</p>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#f6f8f7]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Find Matching Internships</h2>
            <Link
              to="/internships"
              className="text-[#3b82f6] font-bold hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {internshipsForDisplay.map((job) => (
              <Link
                to={`/internships/${job.id}`}
                key={job.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#3b82f6] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={job.company_logo || `https://picsum.photos/seed/internship-${job.id}/40/40`}
                    alt={job.company_name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-[#3b82f6] transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2">
                      {job.company_name} | {job.location}
                    </p>
                    <div className="flex gap-2">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        {salaryText(job)}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        {job.work_mode}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-[#3b82f6] transition-colors" />
              </Link>
            ))}
          </div>
          {!loading && !internshipsForDisplay.length && profileSkills.length && (
            <p className="text-sm text-gray-500 mt-4">
              No internships match this student's registered skills yet.
            </p>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto bg-[#3b82f6] rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-[#111816] max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to start your career?
            </h2>
            <p className="text-lg opacity-90">
              Join thousands of students finding their internship match on Nissaet.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/register"
              className="bg-white text-[#111816] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap text-center"
            >
              Create Student Profile
            </Link>
            <Link
              to="/internships"
              className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap text-center"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
