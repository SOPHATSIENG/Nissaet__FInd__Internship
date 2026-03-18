import {Plus, Search, X} from 'lucide-react';
import {motion} from 'motion/react';
import {useEffect, useMemo, useState} from 'react';
import api from '../../../api/axios';
import {type ProfileSettingsPayload, type ProfileSkill, type SkillLevel} from '../types';
import {InputField} from '../shared/InputField';
import {SectionHeader} from '../shared/SectionHeader';
import {SelectField} from '../shared/SelectField';

interface SkillsTabProps {
  data: ProfileSkill[];
  onSaved: (settings: ProfileSettingsPayload) => void;
}

const LEVEL_OPTIONS = [
  {value: 'beginner', label: 'Beginner'},
  {value: 'intermediate', label: 'Intermediate'},
  {value: 'advanced', label: 'Advanced'},
  {value: 'expert', label: 'Expert'},
];

const toLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function SkillsTab({data, onSaved}: SkillsTabProps) {
  // FIX MARK: skills tab now loads/saves skill rows from user_skills + skills tables.
  const [skills, setSkills] = useState<ProfileSkill[]>(data || []);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{id?: number; name: string; category?: string}>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSkills(data || []);
  }, [data]);

  useEffect(() => {
    let isCurrent = true;
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const response = await api.getSkills({
          search: searchText || undefined,
          limit: searchText ? 8 : 6,
        });
        if (!isCurrent) return;
        setSuggestions(Array.isArray(response?.skills) ? response.skills : []);
      } catch {
        if (isCurrent) setSuggestions([]);
      } finally {
        if (isCurrent) setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchText]);

  const normalizedSkillNames = useMemo(
    () => new Set(skills.map((skill) => skill.name.trim().toLowerCase())),
    [skills]
  );

  const addSkill = (skill: {id?: number; name: string; category?: string}) => {
    if (!skill.name || normalizedSkillNames.has(skill.name.trim().toLowerCase())) return;
    setSkills((previous) => [
      ...previous,
      {
        id: skill.id,
        name: skill.name,
        category: skill.category || '',
        proficiency: 'intermediate',
        years_experience: 0,
        is_primary: false,
      },
    ]);
    setSearchText('');
  };

  const addManualSkill = () => {
    const normalized = searchText.trim();
    if (!normalized || normalizedSkillNames.has(normalized.toLowerCase())) return;
    addSkill({name: normalized, category: 'general'});
  };

  const removeSkill = (name: string) => {
    setSkills((previous) => previous.filter((skill) => skill.name !== name));
  };

  const updateProficiency = (skillName: string, value: string) => {
    const proficiency = value as SkillLevel;
    setSkills((previous) =>
      previous.map((skill) =>
        skill.name === skillName
          ? {
              ...skill,
              proficiency,
            }
          : skill
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const response = await api.updateSkillSettings({
        skills: skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          category: skill.category || 'general',
          proficiency: skill.proficiency || 'intermediate',
          years_experience: skill.years_experience || 0,
          is_primary: !!skill.is_primary,
        })),
      });

      if (response?.settings) {
        onSaved(response.settings);
      }
      setStatus('Skills saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save skills.');
    } finally {
      setSaving(false);
    }
  };

  const recommendedSkills = suggestions.filter(
    (skill) => !normalizedSkillNames.has(String(skill.name || '').trim().toLowerCase())
  );

  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      className="flex flex-col md:flex-row gap-8"
    >
      <div className="flex-1 space-y-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <SectionHeader title="Add New Skill" description="Search skills from DB or add your own skill name." />
          <InputField
            placeholder="e.g. Python, UI/UX Design, Project Management"
            icon={Search}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            rightElement={
              <button type="button" className="text-xs text-emerald-600 font-semibold" onClick={addManualSkill}>
                Add
              </button>
            }
          />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Your Skills</h3>
            <span className="text-sm text-slate-400">{skills.length} Added</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="p-5 border border-slate-100 rounded-xl bg-slate-50/30 relative"
              >
                <button
                  type="button"
                  onClick={() => removeSkill(skill.name)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
                <p className="font-semibold text-slate-700 mb-4">{skill.name}</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Proficiency
                  </label>
                  <SelectField
                    options={LEVEL_OPTIONS}
                    value={skill.proficiency || 'intermediate'}
                    onChange={(event) => updateProficiency(skill.name, event.target.value)}
                  />
                </div>
              </div>
            ))}

            {skills.length === 0 && (
              <p className="text-sm text-slate-400 md:col-span-2">No skills added yet.</p>
            )}
          </div>

          {(status || error) && (
            <p className={`text-sm mt-6 ${error ? 'text-red-600' : 'text-emerald-600'}`}>{error || status}</p>
          )}

          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 disabled:opacity-70 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              {saving ? 'Saving...' : 'Save Skills'}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Plus size={18} />
            </div>
            <h3 className="font-semibold text-slate-800">Recommended for You</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Suggested skills from your database skill catalog.
          </p>

          <div className="space-y-4">
            {loadingSuggestions && (
              <p className="text-xs text-slate-400">Loading suggestions...</p>
            )}
            {!loadingSuggestions && recommendedSkills.length === 0 && (
              <p className="text-xs text-slate-400">No suggestions found.</p>
            )}
            {recommendedSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{skill.name}</p>
                  <p className="text-[10px] text-slate-400">{skill.category || 'General'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Add ${toLabel(skill.name)}`}
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
