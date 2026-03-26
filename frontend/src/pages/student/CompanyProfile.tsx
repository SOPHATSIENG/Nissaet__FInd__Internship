
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Building2, Globe, MapPin, ShieldCheck, Users, Loader2, ArrowLeft, Briefcase } from 'lucide-react';
import api from '../../api/axios';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any | null>(null);
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
