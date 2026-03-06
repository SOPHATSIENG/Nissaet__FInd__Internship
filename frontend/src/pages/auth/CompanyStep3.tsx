import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { registrationStorage } from '../../utils/registrationStorage';

export function CompanyStep3() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    industry: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    const step1 = registrationStorage.getStep1();
    const step2 = registrationStorage.getStep2();
    const role = registrationStorage.getRole();

    if (!step1 || !step2 || role !== 'company') {
      navigate('/register', { replace: true });
      return;
    }

    setSummary({
      company_name: step2.company_name || step1.company_name || '',
      contact_person: step2.contact_person || step1.full_name || '',
      email: step1.email || '',
      industry: step2.industry || 'Not provided',
      location: step2.location || step1.location || 'Not provided',
      website: step2.website || 'Not provided',
    });
  }, [navigate]);

  const handleFinish = async (event: React.FormEvent) => {
    event.preventDefault();
    const step1 = registrationStorage.getStep1();
    const step2 = registrationStorage.getStep2();

    if (!step1 || !step2) {
      navigate('/register', { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await register({
        ...step1,
        ...step2,
        role: 'company',
        company_name: step2.company_name || step1.company_name,
      });
      navigate('/company');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-[#137fec]/90 to-[#137fec]/40"
      title="Review and Launch"
      subtitle="Confirm your company profile details and complete your registration."
      stepIndicator={{ current: 3, total: 3 }}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Final Review</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137fec] bg-[#137fec]/10 px-2 py-1 rounded">Step 3 of 3</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Make sure your details are correct before creating your company account.
        </p>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <ShieldCheck className="h-5 w-5 text-[#137fec]" />
            <span className="font-semibold">Profile Summary</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Company Name</p>
              <p className="font-medium text-slate-900">{summary.company_name || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Contact Person</p>
              <p className="font-medium text-slate-900">{summary.contact_person || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{summary.email || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Industry</p>
              <p className="font-medium text-slate-900">{summary.industry || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Location</p>
              <p className="font-medium text-slate-900">{summary.location || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Website</p>
              <p className="font-medium text-slate-900">{summary.website || '-'}</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="pt-2 flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-1/3"
            icon={ArrowLeft}
            iconPosition="left"
            onClick={() => navigate('/register/company/step-2')}
          >
            Back
          </Button>
          <Button type="submit" className="flex-1" icon={CheckCircle2} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Finish Registration'}
          </Button>
        </div>
      </form>
    </SplitLayout>
  );
}
