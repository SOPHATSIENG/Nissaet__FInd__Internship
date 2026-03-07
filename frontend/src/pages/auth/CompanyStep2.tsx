import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building2, Globe, MapPin, User, Phone, Image as ImageIcon } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { registrationStorage } from '../../utils/registrationStorage';

export function CompanyStep2() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyBio, setCompanyBio] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const step1 = registrationStorage.getStep1();
    const role = registrationStorage.getRole();

    if (!step1 || role !== 'company') {
      navigate('/register', { replace: true });
      return;
    }

    const step2 = registrationStorage.getStep2();
    setCompanyName((step2?.company_name || step1.company_name || '').trim());
    setLocation((step2?.location || step1.location || '').trim());
    setContactPerson((step2?.contact_person || step1.full_name || '').trim());
    setContactPhone((step2?.contact_phone || '').trim());
    setIndustry((step2?.industry || '').trim());
    setWebsite((step2?.website || '').trim());
    setCompanyBio((step2?.company_bio || '').trim());
    setLogo((step2?.logo || '').trim());
  }, [navigate]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setError('');

    registrationStorage.setStep2({
      company_name: companyName.trim(),
      industry: industry || null,
      website: website.trim() || null,
      location: location.trim() || null,
      contact_person: contactPerson.trim() || null,
      contact_phone: contactPhone.trim() || null,
      company_bio: companyBio.trim() || null,
      logo: logo || null,
    });

    navigate('/register/company/step-3');
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-[#137fec]/90 to-[#137fec]/40"
      title="Build Your Corporate Identity"
      subtitle="Showcase your company culture and connect with top talent looking for their next big opportunity."
      stepIndicator={{ current: 2, total: 3 }}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Corporate Profile</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137fec] bg-[#137fec]/10 px-2 py-1 rounded">Step 2 of 3</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Tell us about your company to attract the best candidates.
        </p>
      </div>

      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Logo</label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8 hover:bg-slate-50 transition-colors cursor-pointer group bg-white">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-300 group-hover:text-[#137fec] transition-colors" />
              <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                <label htmlFor="logo-upload" className="relative cursor-pointer rounded-md font-semibold text-[#137fec] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#137fec] focus-within:ring-offset-2 hover:text-[#137fec]/80">
                  <span>Upload a file</span>
                  <input
                    id="logo-upload"
                    name="logo-upload"
                    type="file"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setLogo(file ? file.name : '');
                    }}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">PNG, JPG, GIF up to 5MB</p>
              {logo ? <p className="mt-2 text-xs font-medium text-slate-600">{logo}</p> : null}
            </div>
          </div>
        </div>

        <Input
          label="Company Name"
          placeholder="Acme Corp"
          icon={Building2}
          required
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Industry"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            options={[
              { value: '', label: 'Select Industry' },
              { value: 'tech', label: 'Technology' },
              { value: 'finance', label: 'Finance' },
              { value: 'healthcare', label: 'Healthcare' },
            ]}
          />
          <Input
            label="Website URL"
            type="url"
            placeholder="https://..."
            icon={Globe}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        <Input
          label="Headquarters Location"
          placeholder="City, Country"
          icon={MapPin}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Person"
            placeholder="Jane Smith"
            icon={User}
            value={contactPerson}
            onChange={(event) => setContactPerson(event.target.value)}
          />
          <Input
            label="Contact Phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            icon={Phone}
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Bio</label>
          <textarea
            className="block w-full rounded-lg border-0 bg-white py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all min-h-[100px]"
            placeholder="Briefly describe your company, mission, and culture..."
            value={companyBio}
            onChange={(event) => setCompanyBio(event.target.value)}
          ></textarea>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-1/3"
            icon={ArrowLeft}
            iconPosition="left"
            onClick={() => navigate('/register')}
          >
            Back
          </Button>
          <Button type="submit" className="w-2/3" icon={ArrowRight}>
            Continue to Step 3
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </form>
    </SplitLayout>
  );
}
