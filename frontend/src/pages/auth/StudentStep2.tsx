import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Phone, Calendar, MapPin, GraduationCap, Building2, UploadCloud } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { registrationStorage } from '../../utils/registrationStorage';

export function StudentStep2() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [education, setEducation] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const step1 = registrationStorage.getStep1();
    const role = registrationStorage.getRole();

    if (!step1 || role !== 'student') {
      navigate('/register', { replace: true });
      return;
    }

    const step2 = registrationStorage.getStep2();
    if (!step2) return;

    setPhone(step2.phone || '');
    setDob(step2.dob || '');
    setAddress(step2.address || '');
    setEducation(step2.education || '');
    setGraduationYear(step2.graduation_year ? String(step2.graduation_year) : '');
    setUniversity(step2.university || '');
    setBio(step2.bio || '');
    setCvUrl(step2.cv_url || '');
  }, [navigate]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!dob) {
      setError('Date of birth is required.');
      return;
    }
    if (dob) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        setError('Date of birth must be a valid date.');
        return;
      }
      const parsed = new Date(`${dob}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        setError('Date of birth must be a valid date.');
        return;
      }
      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (parsed > todayMidnight) {
        setError('Date of birth cannot be in the future.');
        return;
      }
    }
    if (!address.trim()) {
      setError('Address is required.');
      return;
    }
    if (!education) {
      setError('Education level is required.');
      return;
    }
    if (!graduationYear.trim()) {
      setError('Graduation year is required.');
      return;
    }
    if (!/^\d{4}$/.test(graduationYear.trim())) {
      setError('Graduation year must be a 4-digit year.');
      return;
    }
    if (!university.trim()) {
      setError('University / institution name is required.');
      return;
    }
    if (!bio.trim()) {
      setError('Bio is required.');
      return;
    }
    if (!cvUrl) {
      setError('Resume / CV is required.');
      return;
    }

    setError('');
    registrationStorage.setStep2({
      phone: phone.trim() || null,
      dob: dob || null,
      address: address.trim() || null,
      education: education || null,
      graduation_year: graduationYear ? Number(graduationYear) : null,
      university: university.trim() || null,
      bio: bio.trim() || null,
      cv_url: cvUrl || null,
    });
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
            type="tel"
            placeholder="+1 (555) 000-0000"
            icon={Phone}
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            label="Date of Birth"
            type="date"
            icon={Calendar}
            required
            value={dob}
            onChange={(event) => setDob(event.target.value)}
          />
        </div>

        <Input
          label="Address"
          placeholder="123 Main St, City, Country"
          icon={MapPin}
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="text-[#137fec] h-5 w-5" /> Academic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <Select
              label="Education Level"
              value={education}
              onChange={(event) => setEducation(event.target.value)}
              required
              options={[
                { value: '', label: 'Select Level' },
                { value: 'high_school', label: 'High School' },
                { value: 'undergraduate', label: 'Undergraduate' },
                { value: 'graduate', label: 'Graduate' },
                { value: 'phd', label: 'PhD' },
              ]}
            />
            <Input
              label="Graduation Year"
              type="number"
              placeholder="YYYY"
              min="2000"
              max="2100"
              required
              value={graduationYear}
              onChange={(event) => setGraduationYear(event.target.value)}
            />
          </div>

          <Input
            label="University / Institution Name"
            placeholder="e.g. Stanford University"
            icon={Building2}
            required
            value={university}
            onChange={(event) => setUniversity(event.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <textarea
            className="block w-full rounded-lg border-0 bg-white py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all min-h-[100px]"
            placeholder="Tell us a bit about your interests, skills, and what kind of internships you're looking for..."
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            required
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
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    required
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setCvUrl(file ? file.name : '');
                    }}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">PDF, DOC up to 10MB</p>
              {cvUrl ? <p className="mt-2 text-xs font-medium text-slate-600">{cvUrl}</p> : null}
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

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        ) : null}
      </form>
    </SplitLayout>
  );
}
