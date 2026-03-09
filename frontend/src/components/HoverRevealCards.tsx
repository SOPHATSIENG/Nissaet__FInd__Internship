import { useState } from "react";
import {
  Code2,
  Briefcase,
  GraduationCap,
  BarChart3,
  Globe,
  Lightbulb,
  ArrowRight,
  Star,
  Users,
  Zap,
} from "lucide-react";

interface CardData {
  id: number;
  icon: React.ReactNode;
  category: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  tags: string[];
  accentColor: string;
  bgGradient: string;
  overlayGradient: string;
  ctaText: string;
}

const cards: CardData[] = [
  {
    id: 1,
    icon: <Code2 className="w-8 h-8" />,
    category: "Engineering",
    title: "Software Development",
    description:
      "Build cutting-edge products with modern tech stacks. Work alongside senior engineers and ship real features that millions of users will love.",
    stats: [
      { label: "Open roles", value: "124" },
      { label: "Avg. stipend", value: "฿18k" },
      { label: "Top companies", value: "32" },
    ],
    tags: ["React", "Python", "Node.js", "Go"],
    accentColor: "text-violet-400",
    bgGradient: "from-violet-950 via-indigo-950 to-slate-950",
    overlayGradient: "from-violet-600/20 via-transparent to-transparent",
    ctaText: "Explore roles",
  },
  {
    id: 2,
    icon: <BarChart3 className="w-8 h-8" />,
    category: "Analytics",
    title: "Data Science & AI",
    description:
      "Turn raw data into powerful insights. Dive into machine learning pipelines, dashboards, and predictive models that drive real business decisions.",
    stats: [
      { label: "Open roles", value: "89" },
      { label: "Avg. stipend", value: "฿20k" },
      { label: "Top companies", value: "21" },
    ],
    tags: ["Python", "SQL", "TensorFlow", "Tableau"],
    accentColor: "text-cyan-400",
    bgGradient: "from-cyan-950 via-teal-950 to-slate-950",
    overlayGradient: "from-cyan-500/20 via-transparent to-transparent",
    ctaText: "View opportunities",
  },
  {
    id: 3,
    icon: <Lightbulb className="w-8 h-8" />,
    category: "Design",
    title: "Product & UX Design",
    description:
      "Shape how people experience digital products. Research users, prototype interfaces, and craft seamless journeys from idea to pixel-perfect screens.",
    stats: [
      { label: "Open roles", value: "67" },
      { label: "Avg. stipend", value: "฿16k" },
      { label: "Top companies", value: "18" },
    ],
    tags: ["Figma", "Prototyping", "Research", "Branding"],
    accentColor: "text-amber-400",
    bgGradient: "from-amber-950 via-orange-950 to-slate-950",
    overlayGradient: "from-amber-500/20 via-transparent to-transparent",
    ctaText: "See design roles",
  },
  {
    id: 4,
    icon: <Globe className="w-8 h-8" />,
    category: "Marketing",
    title: "Digital Marketing",
    description:
      "Drive growth through compelling campaigns. Learn SEO, paid ads, social strategy, and content creation in fast-paced startup environments.",
    stats: [
      { label: "Open roles", value: "53" },
      { label: "Avg. stipend", value: "฿14k" },
      { label: "Top companies", value: "26" },
    ],
    tags: ["SEO", "Google Ads", "Content", "Analytics"],
    accentColor: "text-emerald-400",
    bgGradient: "from-emerald-950 via-green-950 to-slate-950",
    overlayGradient: "from-emerald-500/20 via-transparent to-transparent",
    ctaText: "Browse marketing",
  },
  {
    id: 5,
    icon: <Briefcase className="w-8 h-8" />,
    category: "Business",
    title: "Business Development",
    description:
      "Identify new markets and forge strategic partnerships. Work on revenue models, pitch decks, and growth strategies alongside founders.",
    stats: [
      { label: "Open roles", value: "41" },
      { label: "Avg. stipend", value: "฿15k" },
      { label: "Top companies", value: "14" },
    ],
    tags: ["Strategy", "Sales", "Finance", "Startups"],
    accentColor: "text-rose-400",
    bgGradient: "from-rose-950 via-pink-950 to-slate-950",
    overlayGradient: "from-rose-500/20 via-transparent to-transparent",
    ctaText: "Find opportunities",
  },
  {
    id: 6,
    icon: <GraduationCap className="w-8 h-8" />,
    category: "Research",
    title: "Academic & Research",
    description:
      "Collaborate with universities and R&D labs. Publish papers, contribute to open-source projects, and build fundamental knowledge in your field.",
    stats: [
      { label: "Open roles", value: "28" },
      { label: "Avg. stipend", value: "฿12k" },
      { label: "Top institutes", value: "9" },
    ],
    tags: ["Academia", "Publications", "Lab work", "Grants"],
    accentColor: "text-sky-400",
    bgGradient: "from-sky-950 via-blue-950 to-slate-950",
    overlayGradient: "from-sky-500/20 via-transparent to-transparent",
    ctaText: "Explore research",
  },
];

interface HoverCardProps {
  card: CardData;
}

function HoverCard({ card }: HoverCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        bg-gradient-to-br ${card.bgGradient}
        border border-white/5
        transition-all duration-500 ease-out
        ${hovered ? "scale-[1.03] shadow-2xl shadow-black/60 border-white/10" : "scale-100 shadow-lg shadow-black/30"}
        h-72
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Animated accent glow */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br ${card.overlayGradient}
          transition-opacity duration-500
          ${hovered ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Decorative orb */}
      <div
        className={`
          absolute -top-16 -right-16 w-48 h-48 rounded-full
          bg-white/5 blur-3xl
          transition-all duration-700
          ${hovered ? "scale-150 opacity-60" : "scale-100 opacity-20"}
        `}
      />

      {/* ── DEFAULT FACE ── */}
      <div
        className={`
          absolute inset-0 p-6 flex flex-col justify-between
          transition-all duration-400
          ${hovered ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}
        `}
      >
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full
              text-xs font-semibold tracking-wide uppercase
              bg-white/10 ${card.accentColor}
            `}
          >
            {card.category}
          </span>
          <div className={`p-2 rounded-xl bg-white/10 ${card.accentColor}`}>
            {card.icon}
          </div>
        </div>

        {/* Bottom */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Star className="w-3.5 h-3.5" />
            <span>Hover to explore</span>
          </div>
        </div>
      </div>

      {/* ── HOVER FACE ── */}
      <div
        className={`
          absolute inset-0 p-6 flex flex-col justify-between
          transition-all duration-400
          ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
        `}
      >
        {/* Description */}
        <div>
          <div className={`flex items-center gap-2 mb-3 ${card.accentColor}`}>
            {card.icon}
            <span className="text-sm font-semibold uppercase tracking-wider">
              {card.category}
            </span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
            {card.description}
          </p>
        </div>

        {/* Stats row */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {card.stats.map((s) => (
              <div
                key={s.label}
                className="flex-1 bg-white/10 rounded-xl p-2.5 text-center"
              >
                <div className={`text-lg font-bold ${card.accentColor}`}>
                  {s.value}
                </div>
                <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tags + CTA */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {card.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              className={`
                flex items-center gap-1 text-sm font-semibold ${card.accentColor}
                hover:gap-2.5 transition-all duration-200
              `}
            >
              {card.ctaText}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HoverRevealCards() {
  return (
    <section className="py-20 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm mb-5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Explore by field
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Find your{" "}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              perfect track
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Hover over any card to discover live stats, top skills, and
            curated internship opportunities in that field.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <HoverCard key={card.id} card={card} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-center gap-3 p-1 pl-5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
            <Users className="w-4 h-4 text-violet-400" />
            <span>
              Join <strong className="text-white">4,200+</strong> students already matched
            </span>
            <button className="ml-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5">
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
