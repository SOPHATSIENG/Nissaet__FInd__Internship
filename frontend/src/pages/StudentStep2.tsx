import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Phone, Calendar, MapPin, GraduationCap, Building2, UploadCloud } from 'lucide-react';
import { SplitLayout } from '../components/SplitLayout';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';

export function StudentStep2() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    dob: '',
    address: '',
    education: '',
    university: '',
    graduation_year: '',
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

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store step 2 data
    localStorage.setItem('registrationStep2', JSON.stringify(formData));
    
    navigate('/register/student/step-3');
  };

  return (
    <SplitLayout
      imageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
      imageOverlayClass="bg-gradient-to-t from-[#137fec]/90 to-[#137fec]/40"
      title="Complete Your Profile"
      subtitle="Tell us more about yourself to help companies find the perfect match for their internships."
      stepIndicator={{ current: 2, total: 3 }}
    >
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-[#137fec] font-bold text-sm uppercase tracking-wider">
          <GraduationCap className="h-5 w-5" /> Student Registration
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Personal & Academic Details</h2>
        <p className="mt-2 text-sm text-slate-500">
          We need a few more details to set up your student account.
        </p>
      </div>

      <form onSubmit={handleNext} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            icon={Phone}
            value={formData.phone}
            onChange={handleChange}
          />
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            icon={Calendar}
            value={formData.dob}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Address"
          name="address"
          placeholder="123 Main St, City, Country"
          icon={MapPin}
          value={formData.address}
          onChange={handleChange}
        />

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="text-[#137fec] h-5 w-5" /> Academic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <Select
              label="Education Level"
              name="education"
              options={[
                { value: '', label: 'Select Level' },
                { value: 'high_school', label: 'High School' },
                { value: 'undergraduate', label: 'Undergraduate' },
                { value: 'graduate', label: 'Graduate' },
                { value: 'phd', label: 'PhD' },
              ]}
              value={formData.education}
              onChange={(e) => handleSelectChange('education', e.target.value)}
            />
            <Input
              label="Graduation Year"
              name="graduation_year"
              type="number"
              placeholder="YYYY"
              min="2000"
              max="2100"
              value={formData.graduation_year}
              onChange={handleChange}
            />
          </div>

          <Input
            label="University / Institution Name"
            name="university"
            placeholder="e.g. Stanford University"
            icon={Building2}
            value={formData.university}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <textarea
            name="bio"
            className="block w-full rounded-lg border-0 bg-white py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all min-h-[100px]"
            placeholder="Tell us a bit about your interests, skills, and what kind of internships you're looking for..."
            value={formData.bio}
            onChange={handleChange}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Resume / CV</label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8 hover:bg-slate-50 transition-colors cursor-pointer group bg-white">
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-300 group-hover:text-[#137fec] transition-colors" />
              <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-[#137fec] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#137fec] focus-within:ring-offset-2 hover:text-[#137fec]/80">
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">PDF, DOC up to 10MB</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-1/3"
            icon={ArrowLeft}
            iconPosition="left"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button type="submit" className="w-2/3" icon={ArrowRight}>
            Continue to Step 3
          </Button>
        </div>
      </form>
    </SplitLayout>
  );
}
