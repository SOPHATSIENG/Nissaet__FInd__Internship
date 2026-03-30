import {ExternalLink} from 'lucide-react';
import {Link} from 'react-router-dom';

const normalizeResumeUrl = (url?: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

export function ApplicationsTab({ applications }: { applications: any[] }) {
  if (!applications.length) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500 font-medium">
        You haven't applied to any internships yet. Apply to options from the internships page.
      </div>
    );
  }

  const getStatusLabel = (status?: string) => {
    const value = String(status || 'pending').toLowerCase();
    if (value === 'shortlisted' || value === 'accepted') return 'Shortlisted';
    if (value === 'unshortlisted' || value === 'rejected') return 'Unshortlisted';
    if (value === 'reviewing') return 'Under Review';
    return 'Pending';
  };

  const getStatusClass = (status?: string) => {
    const value = String(status || 'pending').toLowerCase();
    if (value === 'shortlisted' || value === 'accepted') return 'text-green-600';
    if (value === 'unshortlisted' || value === 'rejected') return 'text-red-600';
    if (value === 'reviewing') return 'text-amber-600';
    return 'text-indigo-600';
  };

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-bold">{app.title}</h3>
                <p className="text-sm text-gray-600">{app.company_name} - {app.location || 'N/A'}</p>
              </div>
              <div className="text-sm text-gray-500">
                Status:{' '}
                <span
                  className={`font-semibold ${getStatusClass(app.status)}`}
                >
                  {getStatusLabel(app.status)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Applied on {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">
                Work mode: {app.work_mode || 'Internship'}
              </div>
              {app.deadline && (
                <div className="text-sm text-gray-500">
                  Deadline: {new Date(app.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <Link
                to={`/internships/${app.internship_id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4" /> View Internship
              </Link>
              {app.company_id ? (
                <Link
                  to={`/companies/${app.company_id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                >
                  View Company Profile
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Company not available"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-100 text-emerald-300 bg-emerald-50 cursor-not-allowed"
                >
                  View Company Profile
                </button>
              )}
            </div>
          </div>

          {app.cover_letter && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Cover Letter</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{app.cover_letter}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
