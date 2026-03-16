import {motion} from 'motion/react';
import {useEffect, useState} from 'react';
import api from '../../../api/axios';
import {type ProfileEducationSettings, type ProfileSettingsPayload} from '../types';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';
import {SelectField} from '../shared/SelectField';

interface EducationTabProps {
  data: ProfileEducationSettings;
  onSaved: (settings: ProfileSettingsPayload) => void;
}

const EMPTY_EDUCATION: ProfileEducationSettings = {
  education: '',
  university: '',
  major: '',
  graduation_year: '',
  gpa: '',
  resume_url: '',
  linkedin_url: '',
  portfolio_url: '',
  is_available: true,
};

const EDUCATION_OPTIONS = [
  {value: '', label: 'Select education level'},
  {value: 'high_school', label: 'High School'},
  {value: 'undergraduate', label: 'Undergraduate'},
  {value: 'graduate', label: 'Graduate'},
  {value: 'postgraduate', label: 'Postgraduate'},
] as const;

export function EducationTab({data, onSaved}: EducationTabProps) {
  // FIX MARK: education fields are now synchronized with DB-backed student profile.
  const educationData = data || EMPTY_EDUCATION;
  const [form, setForm] = useState<ProfileEducationSettings>(educationData);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(educationData);
    setStatus('');
    setError('');
  }, [educationData]);

  const updateField = <K extends keyof ProfileEducationSettings>(key: K, value: ProfileEducationSettings[K]) => {
    setForm((previous) => ({...previous, [key]: value}));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const response = await api.updateEducationSettings({
        education: form.education || null,
        university: form.university || null,
        major: form.major || null,
        graduation_year: form.graduation_year || null,
        gpa: form.gpa || null,
        resume_url: form.resume_url || null,
        linkedin_url: form.linkedin_url || null,
        portfolio_url: form.portfolio_url || null,
        is_available: !!form.is_available,
      });

      if (response?.settings) {
        onSaved(response.settings);
      }
      setStatus('Education settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save education settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-8">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <SectionHeader
          title="Education Background"
          description="Keep your educational details updated. Changes are saved to database."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SelectField
            label="Current Education Level"
            options={[...EDUCATION_OPTIONS]}
            value={String(form.education || '')}
            onChange={(event) => updateField('education', event.target.value)}
          />
          <InputField
            label="University / Institute"
            value={String(form.university || '')}
            onChange={(event) => updateField('university', event.target.value)}
          />
          <InputField
            label="Major"
            value={String(form.major || '')}
            onChange={(event) => updateField('major', event.target.value)}
          />
          <InputField
            label="Graduation Year"
            type="number"
            value={String(form.graduation_year || '')}
            onChange={(event) => updateField('graduation_year', event.target.value)}
          />
          <InputField label="GPA" value={String(form.gpa || '')} onChange={(event) => updateField('gpa', event.target.value)} />
          <InputField
            label="Resume URL"
            value={String(form.resume_url || '')}
            onChange={(event) => updateField('resume_url', event.target.value)}
          />
          <SelectField
            label="Available for Internships"
            options={[
              {value: 'true', label: 'Yes'},
              {value: 'false', label: 'No'},
            ]}
            value={form.is_available ? 'true' : 'false'}
            onChange={(event) => updateField('is_available', event.target.value === 'true')}
          />
          <InputField
            label="LinkedIn URL"
            value={String(form.linkedin_url || '')}
            onChange={(event) => updateField('linkedin_url', event.target.value)}
          />
          <InputField
            label="Portfolio URL"
            value={String(form.portfolio_url || '')}
            onChange={(event) => updateField('portfolio_url', event.target.value)}
          />
        </div>

        {(status || error) && (
          <p className={`text-sm ${error ? 'text-red-600' : 'text-emerald-600'}`}>{error || status}</p>
        )}

        <div className="flex justify-end mt-12 gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 disabled:opacity-70 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
