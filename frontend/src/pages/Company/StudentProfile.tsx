import React, { useState } from 'react';
import { 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Star,
  Download,
  MessageSquare,
  ExternalLink,
  Award,
  CheckCircle2,
  Send,
  ArrowLeft
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

export default function StudentProfile() {
  const { id } = useParams();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) return;
    setIsSubmitted(true);
    // In a real app, this would be an API call
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link 
          to="/applicants" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Applicants
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-50"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative">
                <img 
                  className="h-32 w-32 rounded-3xl border-4 border-white shadow-lg object-cover" 
                  src={`https://picsum.photos/seed/student${id || '1'}/200/200`}
                  alt="Student Profile" 
                />
                <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-center md:text-left pb-2">
                <h1 className="text-3xl font-bold text-slate-900">Sophea Chan</h1>
                <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                  <GraduationCap size={18} className="text-primary" />
                  Senior Year Student at RUPP
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-2">
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <ExternalLink size={18} />
                View Resume
              </a>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                <Download size={18} />
                Download CV
              </button>
              <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all">
                <MessageSquare size={18} />
                Contact Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Professional Summary</h3>
            <p className="text-slate-600 leading-relaxed">
              Highly motivated Computer Science student with a strong foundation in web development and a passion for creating user-centric applications. Experienced in React, Node.js, and modern CSS frameworks. Looking for an internship opportunity to apply my technical skills and contribute to innovative projects while learning from industry professionals.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Education</h3>
            <div className="space-y-6">
              {[
                { school: 'Royal University of Phnom Penh', degree: 'Bachelor of Computer Science', period: '2020 - Present', gpa: '3.8/4.0' },
                { school: 'Bak Touk High School', degree: 'High School Diploma', period: '2014 - 2020', gpa: 'Grade A' },
              ].map((edu, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <GraduationCap size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{edu.school}</h4>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{edu.period}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{edu.degree}</p>
                    <p className="text-xs font-semibold text-primary mt-2">GPA: {edu.gpa}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Work Experience</h3>
            <div className="space-y-6">
              {[
                { company: 'Tech Solutions Co.', role: 'Junior Web Developer (Part-time)', period: 'Jan 2023 - Present', description: 'Assisting in developing and maintaining client websites using React and Tailwind CSS. Collaborating with senior developers on feature implementation and bug fixes.' },
                { company: 'Creative Agency', role: 'Graphic Design Intern', period: 'Jun 2022 - Aug 2022', description: 'Created social media graphics and marketing materials for various clients. Assisted in UI/UX design for mobile applications.' },
              ].map((exp, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Briefcase size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{exp.role}</h4>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{exp.period}</span>
                    </div>
                    <p className="text-sm font-semibold text-primary mt-1">{exp.company}</p>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Applied Internships</h3>
            <div className="space-y-4">
              {[
                { title: 'Marketing Intern', company: 'ABA Bank', status: 'Pending', date: 'Oct 24, 2023' },
                { title: 'Frontend Developer', company: 'Smart Axiata', status: 'Interview', date: 'Oct 15, 2023' },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
                      <p className="text-xs text-slate-500">{job.company} • {job.date}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    job.status === 'Interview' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Rate this Student</h3>
            {isSubmitted ? (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <CheckCircle2 className="mx-auto text-blue-500 mb-2" size={24} />
                <p className="text-sm font-bold text-blue-900">Rating Submitted!</p>
                <p className="text-xs text-blue-700 mt-1">Thank you for your feedback.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit Rating
                </button>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        size={32} 
                        className={`${
                          (hoverRating || userRating) >= star 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-slate-500">
                    {userRating === 0 ? 'Select a rating' : `You rated ${userRating} stars`}
                  </span>
                </div>
                <textarea
                  placeholder="Add a comment (optional)..."
                  className="w-full rounded-lg border-slate-200 text-sm focus:ring-primary focus:border-primary"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
                <button
                  type="submit"
                  disabled={userRating === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  Submit Rating
                </button>
              </form>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={18} className="text-slate-400" />
                sophea.chan@email.com
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={18} className="text-slate-400" />
                +855 12 345 678
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={18} className="text-slate-400" />
                Phnom Penh, Cambodia
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'UI Design', 'Public Speaking', 'Marketing Strategy'].map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-slate-100">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ratings & Reviews</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map(n => <Star key={n} size={18} fill={n <= 4 ? 'currentColor' : 'none'} />)}
              </div>
              <span className="text-sm font-bold text-slate-900">4.2</span>
              <span className="text-xs text-slate-500">(12 reviews)</span>
            </div>
            <div className="space-y-4">
              {[
                { author: 'Smart Axiata', comment: 'Great team player and very quick learner.', rating: 5 },
                { author: 'Canadia Bank', comment: 'Good technical skills, needs more focus on documentation.', rating: 4 },
              ].map((rev, i) => (
                <div key={i} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{rev.author}</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={10} fill={n <= rev.rating ? 'currentColor' : 'none'} />)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
