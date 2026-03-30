
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Building2, Globe, MapPin, ShieldCheck, Users, Loader2, ArrowLeft, Briefcase, Star } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [company, setCompany] = useState<any | null>(null);
  const [internships, setInternships] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadCompany = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError('');
        
        const by = String(searchParams.get('by') || '').toLowerCase();
        let response;
        
        try {
          if (by === 'user') {
            response = await api.getCompanyByUserId(id);
          } else {
            response = await api.getCompanyById(id);
          }
        } catch (firstError) {
          console.warn('First attempt failed, trying fallback:', firstError);
          // Try the other way as fallback
          if (by === 'user') {
            response = await api.getCompanyById(id);
          } else {
            response = await api.getCompanyByUserId(id);
          }
        }

        if (isMounted) {
          if (response?.company) {
            setCompany(response.company);
            setInternships(Array.isArray(response.internships) ? response.internships : []);
          } else {
            setError('Company profile data is incomplete.');
          }
        }
      } catch (err: any) {
        console.error('Final error loading company:', err);
        const fallbackFromState = (location.state as any)?.companyFallback;
        if (isMounted) {
          if (fallbackFromState) {
            setCompany({
              id,
              user_id: id,
              company_name: fallbackFromState.company_name || 'Company',
              description: '',
              logo: fallbackFromState.logo || null,
              industry: fallbackFromState.industry || '',
              website: fallbackFromState.website || '',
              company_size: null,
              founded_year: null,
              location: fallbackFromState.location || '',
              is_verified: false,
              open_positions: 0,
            });
            setInternships([]);
            setError('');
          } else {
            try {
              const eventId = (location.state as any)?.eventId;
              if (eventId) {
                const eventResponse = await api.get(`/events/${eventId}`, { auth: false });
                const eventData = eventResponse?.data || eventResponse;
                if (eventData) {
                  setCompany({
                    id,
                    user_id: id,
                    company_name: eventData.company_name || 'Company',
                    description: '',
                    logo: eventData.company_logo || null,
                    industry: eventData.industry || '',
                    website: eventData.website || '',
                    company_size: null,
                    founded_year: null,
                    location: eventData.company_location || '',
                    is_verified: false,
                    open_positions: 0,
                  });
                  setInternships([]);
                  setError('');
                  return;
                }
              }

              const by = String(searchParams.get('by') || '').toLowerCase();
              const listResponse = await api.getCompanies({});
              const items = Array.isArray(listResponse?.companies) ? listResponse.companies : [];
              const match = items.find((item: any) =>
                by === 'user' ? String(item.user_id) === String(id) : String(item.id) === String(id)
              ) || items.find((item: any) => String(item.id) === String(id));

              if (match) {
                setCompany(match);
                setInternships([]);
                setError('');
              } else {
                setError(err.message || 'Failed to load company profile.');
              }
            } catch (fallbackError) {
              console.error('Fallback list lookup failed:', fallbackError);
              setError(err.message || 'Failed to load company profile.');
            }
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCompany();
    return () => { isMounted = false; };
  }, [id, searchParams]);

  useEffect(() => {
    let isMounted = true;
    const loadRatings = async () => {
      if (!id) return;
      try {
        const response = await api.getCompanyRatings(id);
        if (!isMounted) return;
        const items = Array.isArray(response?.ratings) ? response.ratings : [];
        setRatings(items);
      } catch (err) {
        if (!isMounted) return;
        setRatings([]);
      }
    };

    loadRatings();
    return () => { isMounted = false; };
  }, [id, ratingSuccess]);

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#137fec]" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-600">{error || 'Company not found.'}</p>
          <button
            onClick={() => navigate('/companies')}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#137fec] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Companies
          </button>
        </div>
      </div>
    );
  }

  const handleRateCompany = async (rating: number) => {
    if (!isAuthenticated || user?.role !== 'student') {
      setRatingError('Please log in as a student to rate companies.');
      return;
    }

    if (!rating || rating < 1) return;

    setRatingError('');
    setRatingSuccess('');
    setRatingSubmitting(true);
    try {
      const response = await api.rateCompany(company.id, rating, ratingComment);
      const updatedRating = Number(response?.rating ?? rating);
      const updatedCount = Number(response?.rating_count ?? 0);
      setCompany((prev: any) =>
        prev ? { ...prev, rating: updatedRating, rating_count: updatedCount } : prev
      );
      setUserRating(rating);
      setRatingSuccess('Rating submitted!');
      setRatingComment('');
    } catch (err: any) {
      setRatingError(err?.message || 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate('/companies')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#137fec] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Companies
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
            {company.logo ? (
              <img src={company.logo} alt={company.company_name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{company.company_name}</h1>
              {company.is_verified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>{Number(company.rating || 0).toFixed(1)}</span>
                <span className="text-[10px] font-semibold text-amber-600/70">
                  ({Number(company.rating_count || 0)})
                </span>
              </span>
            </div>
            <p className="text-slate-500 mt-2">{company.industry || 'Industry not set'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/internships"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f6abf]"
            >
              Browse Internships
            </Link>
            <span className="text-xs text-slate-500 text-center">
              {company.open_positions || 0} open positions
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{company.location || 'Location not set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{company.company_size || 'Company size not set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-[#137fec] hover:underline truncate"
              >
                {company.website}
              </a>
            ) : (
              <span>Website not set</span>
            )}
          </div>
        </div>

        {company.description && (
          <p className="mt-6 text-slate-600 leading-relaxed">{company.description}</p>
        )}

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Rate this company</h2>
          {isAuthenticated && user?.role === 'student' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeValue = hoverRating || userRating || 0;
                  const isActive = activeValue >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={ratingSubmitting}
                      aria-label={`Select ${star} stars`}
                    >
                      <Star
                        className={`h-6 w-6 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20"
                placeholder="Add a comment (optional)..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleRateCompany(userRating || 0)}
                disabled={ratingSubmitting || userRating === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0ea271] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Submit Rating
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Log in as a student to rate companies.</p>
          )}

          {userRating ? (
            <p className="mt-2 text-xs font-semibold text-emerald-600">
              You rated {userRating} stars
            </p>
          ) : null}
          {ratingSuccess ? (
            <p className="mt-2 text-xs font-semibold text-emerald-600">{ratingSuccess}</p>
          ) : null}
          {ratingError ? (
            <p className="mt-2 text-xs font-semibold text-red-600">{ratingError}</p>
          ) : null}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Student Reviews</h2>
          {ratings.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                      {item.profile_image ? (
                        <img src={item.profile_image} alt={item.full_name || 'Student'} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">
                          {(item.full_name || 'Student')
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((token: string) => token[0]?.toUpperCase())
                            .join('')}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.full_name || 'Student'}</p>
                      <div className="flex items-center gap-1 text-amber-600">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${item.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {item.review_text ? (
                    <p className="mt-3 text-sm text-slate-600">{item.review_text}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Active Internships</h2>
          <Link to={`/internships?search=${encodeURIComponent(company.company_name)}`} className="text-sm font-semibold text-[#137fec] hover:underline">
            View all
          </Link>
        </div>

        {internships.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No active internships from this company right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {internships.map((internship) => (
              <Link
                key={internship.id}
                to={`/internships/${internship.id}`}
                className="border border-slate-100 rounded-2xl p-5 hover:border-[#137fec] hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{internship.title}</h3>
                    <p className="text-sm text-slate-500">{internship.location || 'Location TBA'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {internship.work_mode || 'Internship'} • Apply by {internship.application_deadline ? new Date(internship.application_deadline).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
