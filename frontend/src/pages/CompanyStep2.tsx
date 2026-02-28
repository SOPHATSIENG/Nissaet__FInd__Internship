import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building2, Globe, MapPin, User, Phone, Image as ImageIcon } from 'lucide-react';
import { SplitLayout } from '../components/SplitLayout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export function CompanyStep2() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    location: '',
    contact_person: '',
    contact_phone: '',
    bio: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get data from step 1
    const step1Data = JSON.parse(localStorage.getItem('registrationStep1') || '{}');
    
    const completeData = {
      ...step1Data,
      ...formData
    };

    const result = await register(completeData, navigate);
    
    if (!result.success) {
      alert('Registration failed: ' + result.error);
    }
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
                  <input id="logo-upload" name="logo-upload" type="file" className="sr-only" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        <Input
          label="Company Name"
          name="company_name"
          placeholder="Acme Corp"
          icon={Building2}
          value={formData.company_name}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Industry"
            name="industry"
            options={[
              { value: '', label: 'Select Industry' },
              { value: 'tech', label: 'Technology' },
              { value: 'finance', label: 'Finance' },
              { value: 'healthcare', label: 'Healthcare' },
            ]}
            value={formData.industry}
            onChange={(e) => handleSelectChange('industry', e.target.value)}
          />
          <Input
            label="Website URL"
            name="website"
            type="url"
            placeholder="https://..."
            icon={Globe}
            value={formData.website}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Headquarters Location"
          name="location"
          placeholder="City, Country"
          icon={MapPin}
          value={formData.location}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Person"
            name="contact_person"
            placeholder="Jane Smith"
            icon={User}
            value={formData.contact_person}
            onChange={handleChange}
          />
          <Input
            label="Contact Phone"
            name="contact_phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            icon={Phone}
            value={formData.contact_phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Bio</label>
          <textarea
            name="bio"
            className="block w-full rounded-lg border-0 bg-white py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all min-h-[100px]"
            placeholder="Briefly describe your company, mission, and culture..."
            value={formData.bio}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="w-1/4"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button type="submit" className="flex-1" icon={ArrowRight}>
            Continue to Next Step
          </Button>
        </div>
      </form>
    </SplitLayout>
  );
}
