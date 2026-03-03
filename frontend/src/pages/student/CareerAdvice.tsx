import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Clock,
  Eye,
  Map,
  Quote,
  School,
  Verified,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function CareerAdvice() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white pb-12 pt-12 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-[#3b82f6]/10 text-[#2563eb] text-xs font-bold mb-4 tracking-wide uppercase">
            Student Resource Hub
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Nissaet Career Advice Center
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Essential guides, tips, and roadmaps to help Cambodian students land
            their dream internships and kickstart their careers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
              Browse Guides <ArrowDown className="w-5 h-5" />
            </button>
            <button className="bg-transparent border border-gray-200 hover:border-[#3b82f6] text-gray-700 font-medium px-8 py-3 rounded-full transition-colors w-full sm:w-auto justify-center">
              Share Your Story
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Essential Guides */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <School className="w-6 h-6 text-[#3b82f6]" />
                Essential Guides
              </h2>
              <Link
                to="#"
                className="text-[#3b82f6] font-medium text-sm hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "How to write a CV for Cambodian Companies",
                  desc: "Learn what local employers are really looking for. Avoid common mistakes and highlight your soft skills effectively for the Khmer market.",
                  tag: "CV TIPS",
                  readTime: "5 min read",
                  img: "https://picsum.photos/seed/cv/400/200",
                },
                {
                  title: "Mastering the Internship Interview",
                  desc: 'From "Tell me about yourself" to asking the right questions. We break down the interview process for Cambodian students.',
                  tag: "INTERVIEW",
                  readTime: "8 min read",
                  img: "https://picsum.photos/seed/interview/400/200",
                },
              ].map((guide, i) => (
                <article
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group h-full flex flex-col"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={guide.img}
                      alt={guide.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-gray-800">
                      {guide.tag}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl mb-3 group-hover:text-[#3b82f6] transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {guide.desc}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {guide.readTime}
                      </span>
                      <button className="text-[#3b82f6] font-bold text-sm">
                        Read More
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {/* Featured Large Guide */}
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group md:col-span-2 h-full flex flex-col md:flex-row">
                <div className="md:w-2/5 h-48 md:h-auto overflow-hidden relative">
                  <img
                    src="https://picsum.photos/seed/salary/400/400"
                    alt="Salary Negotiation"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-gray-800">
                    SALARY
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-xl mb-3 group-hover:text-[#3b82f6] transition-colors">
                    Understanding Internship Salaries in 2024
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Unpaid vs. Paid? What is a fair allowance in Phnom Penh? We
                    analyzed data from over 500 listings to give you the
                    benchmarks you need to know before accepting an offer.
                  </p>
                  <div className="mt-auto flex items-center gap-4">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 10 min read
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> 2.4k views
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* Skills Roadmap Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-8 h-8 text-[#3b82f6]" />
                <div>
                  <h3 className="font-bold text-lg leading-none">
                    Skills Roadmap
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on trending DB skills
                  </p>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:h-[calc(100%-24px)] before:w-0.5 before:bg-gray-100">
                {[
                  {
                    num: 1,
                    title: "Digital Literacy",
                    desc: "Microsoft Office, Google Suite, Zoom",
                    progress: 90,
                    color: "bg-[#3b82f6]",
                    text: "text-[#2563eb]",
                    bg: "bg-[#3b82f6]/20",
                    label: "Most Requested",
                  },
                  {
                    num: 2,
                    title: "English Communication",
                    desc: "Writing emails, Basic conversation",
                    progress: 75,
                    color: "bg-blue-500",
                    text: "text-blue-600",
                    bg: "bg-blue-100",
                    label: "Highly Desirable",
                  },
                  {
                    num: 3,
                    title: "Design Basics",
                    desc: "Canva, Basic Photoshop",
                    progress: 45,
                    color: "bg-purple-500",
                    text: "text-purple-600",
                    bg: "bg-purple-100",
                    label: "Rising Trend",
                  },
                  {
                    num: 4,
                    title: "Frontend Basics",
                    desc: "HTML, CSS, Tailwind",
                    progress: 30,
                    color: "bg-orange-500",
                    text: "text-orange-600",
                    bg: "bg-orange-100",
                    label: "Niche High Value",
                  },
                ].map((skill, i) => (
                  <div key={i} className="relative pl-12">
                    <div
                      className={`absolute left-0 top-0 w-10 h-10 rounded-full ${skill.bg} ${skill.text} border-4 border-white flex items-center justify-center font-bold z-10`}
                    >
                      {skill.num}
                    </div>
                    <h4 className="font-bold text-base mb-1">{skill.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{skill.desc}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div
                        className={`${skill.color} h-1.5 rounded-full`}
                        style={{ width: `${skill.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                      {skill.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-50 text-center">
                <button className="text-sm font-bold text-[#3b82f6] hover:text-[#2563eb] transition-colors">
                  View Full Roadmap
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Verified className="w-6 h-6 text-[#3b82f6]" />
              Success Stories
            </h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#3b82f6]/10 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I found my internship at ABA Bank through Nissaet. The CV guide really helped me tailor my application. Now I'm a full-time junior developer!",
                name: "Sophea Chan",
                role: "Frontend Developer @ ABA Bank",
                color: "bg-[#3b82f6]",
                img: "https://picsum.photos/seed/sophea/40/40",
              },
              {
                quote:
                  "The salary guide opened my eyes. I was about to accept an unpaid role, but used the data to negotiate a fair allowance. Thank you!",
                name: "Dara Sok",
                role: "Marketing Intern @ Smart",
                color: "bg-blue-500",
                img: "https://picsum.photos/seed/dara/40/40",
              },
              {
                quote:
                  "I didn't know where to start with my portfolio. The 'Design Basics' roadmap gave me a clear path to follow. Highly recommended.",
                name: "Vannak Keo",
                role: "Graphic Designer @ Mango Tango",
                color: "bg-purple-500",
                img: "https://picsum.photos/seed/vannak/40/40",
              },
            ].map((story, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative mt-6"
              >
                <div className="absolute -top-6 left-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${story.color} text-white flex items-center justify-center shadow-lg`}
                  >
                    <Quote className="w-6 h-6 fill-current" />
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-gray-600 mb-6 italic leading-relaxed">
                    "{story.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={story.img}
                      alt={story.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm">{story.name}</h4>
                      <p className="text-xs text-gray-500">{story.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="bg-[#10221c] rounded-3xl p-8 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#3b82f6]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Stay Ahead of the Curve
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Get the latest career advice, internship trends, and exclusive
              resources delivered straight to your inbox every week.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] backdrop-blur-sm"
              />
              <button
                type="button"
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-[#111816] font-bold px-8 py-4 rounded-xl transition-colors whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-4">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
