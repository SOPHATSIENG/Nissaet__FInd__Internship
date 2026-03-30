import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Search, Plus, X } from 'lucide-react';
import { SplitLayout } from '../../components/SplitLayout';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { registrationStorage } from '../../utils/registrationStorage';
import api from '../../api/axios';

type SkillOption = {
  id?: number;
  name: string;
  category?: string | null;
};

type SelectedSkill = {
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
};

export function StudentStep3() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillsError, setSkillsError] = useState('');

  useEffect(() => {
    const step1 = registrationStorage.getStep1();
    const step2 = registrationStorage.getStep2();
    const role = registrationStorage.getRole();

    if (!step1 || !step2 || role !== 'student') {
      navigate('/register', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsLoadingSkills(true);
        setSkillsError('');
        // FIXED: Step 3 now pulls skills dynamically from DB.
        const data = await api.getSkills({ search: searchTerm, limit: 80 });
        if (!cancelled) {
          setAvailableSkills(Array.isArray(data?.skills) ? data.skills : []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setSkillsError(fetchError instanceof Error ? fetchError.message : 'Failed to load skills from database.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSkills(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const selectedNames = useMemo(
    () => new Set(selectedSkills.map((skill) => skill.name.toLowerCase())),
    [selectedSkills]
  );

  const suggestedSkills = useMemo(
    () => availableSkills.filter((skill) => !selectedNames.has(String(skill.name).toLowerCase())),
    [availableSkills, selectedNames]
  );

  const groupedSuggestedSkills = useMemo(() => {
    const grouped = suggestedSkills.reduce<Record<string, SkillOption[]>>((acc, skill) => {
      const category = skill.category?.trim() || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [suggestedSkills]);

  const addSkill = (skill: SkillOption) => {
    const normalizedName = String(skill.name || '').trim();
    if (!normalizedName) return;

    if (selectedNames.has(normalizedName.toLowerCase())) {
      return;
    }

    setSelectedSkills((current) => [
      ...current,
      {
        name: normalizedName,
        category: skill.category?.trim() || 'general',
        proficiency: 'intermediate',
      },
    ]);
    setSearchTerm('');
  };

  const addCustomSkill = () => {
    const customName = searchTerm.trim();
    if (!customName) return;

    addSkill({
      name: customName,
      category: 'general',
    });
  };

  const updateProficiency = (skillName: string, proficiency: SelectedSkill['proficiency']) => {
    setSelectedSkills((current) =>
      current.map((skill) =>
        skill.name === skillName
          ? {
              ...skill,
              proficiency,
            }
          : skill
      )
    );
  };

  const removeSkill = (skillName: string) => {
    setSelectedSkills((current) => current.filter((skill) => skill.name !== skillName));
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    const step1 = registrationStorage.getStep1();
    const step2 = registrationStorage.getStep2();
    if (!step1 || !step2) {
      navigate('/register', { replace: true });
      return;
    }

    if (selectedSkills.length === 0) {
      setError('Please add at least one skill before finishing registration.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      if (step1.is_social) {
        await api.updatePersonalSettings({
          full_name: step1.full_name,
          phone: step2.phone,
          dob: step2.dob,
          address: step2.address,
          bio: step2.bio,
        });
        await api.updateEducationSettings({
          education: step2.education,
          university: step2.university,
          graduation_year: step2.graduation_year,
          resume_url: step2.cv_url,
        });
        await api.updateSkillSettings({ skills: selectedSkills });
        registrationStorage.clearAll();
        navigate('/');
      } else {
        await register({
          ...step1,
          ...step2,
          role: 'student',
          skills: selectedSkills,
        });
        navigate('/');
      }
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
      title="Showcase Your Talent"
      subtitle="Tell us what you're good at. We'll match you with the perfect opportunities based on your unique skillset."
      stepIndicator={{ current: 3, total: 3 }}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Skills & Interests</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#137fec] bg-[#137fec]/10 px-2 py-1 rounded">Step 3 of 3</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Add your skills and proficiency levels. This data is used to match internships.
        </p>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Skills</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                className="block w-full rounded-lg border-0 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all"
                placeholder="Type skill name (e.g. React, Figma, Accounting)"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button type="button" variant="outline" className="shrink-0" icon={Plus} onClick={addCustomSkill}>
              Add
            </Button>
          </div>
          {skillsError ? <p className="mt-2 text-xs text-amber-600">{skillsError}</p> : null}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested From Database</h3>
          {isLoadingSkills ? (
            <p className="text-sm text-slate-500">Loading skills...</p>
          ) : groupedSuggestedSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No skills found for this search.</p>
          ) : (
            groupedSuggestedSkills.slice(0, 4).map(([category, skills]) => (
              <div key={category} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-bold text-slate-900 capitalize">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 8).map((skill) => (
                    <button
                      key={`${category}-${skill.id || skill.name}`}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="group flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#137fec]/10 hover:text-[#137fec] transition-colors"
                    >
                      <span>{skill.name}</span>
                      <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-sm font-medium text-slate-700">Selected Skills & Proficiency</label>
          {selectedSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No skills selected yet.</p>
          ) : (
            <div className="space-y-3">
              {selectedSkills.map((skill) => (
                <div key={skill.name} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200 group">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {skill.name}
                  </span>
                  <div className="flex items-center gap-4">
                    <select
                      className="block w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 bg-slate-50 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#137fec] sm:text-xs sm:leading-6"
                      value={skill.proficiency}
                      onChange={(event) => updateProficiency(skill.name, event.target.value as SelectedSkill['proficiency'])}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button type="button" onClick={() => removeSkill(skill.name)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="pt-6 flex gap-4">
          <Button type="button" variant="outline" className="w-1/3" onClick={() => navigate('/register/student/step-2')}>
            Back
          </Button>
          <Button type="submit" className="flex-1" icon={CheckCircle} disabled={isLoading}>
            {isLoading ? 'Finishing...' : 'Finish Registration'}
          </Button>
        </div>
      </form>
    </SplitLayout>
  );
}
