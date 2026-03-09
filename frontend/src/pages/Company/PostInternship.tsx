import React, { useEffect, useState } from 'react';
import { 
  Info, 
  DollarSign, 
  Brain, 
  X, 
  Plus, 
  Minus, 
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmationModal from '../../components/company-components/ConfirmationModal';

export default function PostInternship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id && id !== 'undefined' && id !== 'null';

  const [formData, setFormData] = useState({
    title: '',
    location: 'Phnom Penh',
    duration: '',
    description: '',
    requirements: '',
    salaryType: 'paid',
    minSalary: '',
    maxSalary: '',
    skills: [],
    positions: 1,
    deadline: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchInternship = async () => {
        try {
          const data = await api.getInternshipById(id);
          if (data.success && data.internship) {
            const i = data.internship;
            setFormData({
              title: i.title || '',
              location: i.location || 'Phnom Penh',
              duration: i.duration ? String(i.duration) : '',
              description: i.description || '',
              requirements: i.requirements || '',
              salaryType: i.stipend > 0 ? 'paid' : 'unpaid',
              minSalary: i.stipend ? String(i.stipend) : '',
              maxSalary: '', // Not always in DB, adjust if needed
              skills: i.skills ? i.skills.map(s => s.name) : [],
              positions: i.positions || 1,
              deadline: i.deadline ? i.deadline.split('T')[0] : ''
            });
          }
        } catch (err) {
          console.error('Failed to fetch internship:', err);
          setError('Could not load internship details.');
        } finally {
          setLoading(false);
        }
      };
      fetchInternship();
    }
  }, [id, isEditMode]);

  const validate = () => {
    if (!formData.title.trim()) return 'Internship title is required.';
    if (!formData.location.trim()) return 'Location is required.';
    if (!formData.duration.trim()) return 'Duration is required.';
    if (!formData.description.trim()) return 'Job description is required.';
    if (!formData.requirements.trim()) return 'Requirements are required.';
    if (formData.salaryType === 'paid' && !formData.minSalary) return 'Minimum salary is required for paid internships.';
    if (!formData.deadline) return 'Application deadline is required.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError('');
    setSubmitting(true);

    const payload = {
      title: formData.title,
      location: formData.location,
      duration_months: parseInt(formData.duration),
      description: formData.description,
      requirements: formData.requirements,
      stipend: formData.salaryType === 'paid' ? parseFloat(formData.minSalary) : 0,
      positions: formData.positions,
      application_deadline: formData.deadline,
      skills: formData.skills.map(s => ({ name: s, required: true })),
      type: 'full-time' // default
    };

    try {
      if (isEditMode) {
        await api.updateInternship(id, payload);
      } else {
        await api.createInternship(payload);
      }
      navigate('/company');
    } catch (err) {
      console.error('Failed to save internship:', err);
      setError(err.message || 'Failed to save internship. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteInternship(id);
      setIsDeleteModalOpen(false);
      navigate('/company');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete internship.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 md:px-6 flex flex-col gap-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Internship Post' : 'Create New Internship'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditMode ? 'Update the details of your internship listing.' : 'Fill in the details to find the best talent for your team.'}
          </p>
        </div>
        <div className="flex gap-3">
          {isEditMode && (
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
              Delete Post
            </button>
          )}
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Basic Information
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="title">Internship Title *</label>
              <div className="mt-2">
                <input 
                  className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                  id="title" 
                  placeholder="e.g. Junior Marketing Intern" 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="location">Location (Province) *</label>
                <div className="mt-2">
                  <select 
                    className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  >
                    <option>Phnom Penh</option>
                    <option>Siem Reap</option>
                    <option>Battambang</option>
                    <option>Sihanoukville</option>
                    <option>Kampot</option>
                    <option>Remote</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="duration">Duration (Months) *</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <input 
                    className="block w-full rounded-lg border-0 py-2.5 pr-12 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                    id="duration" 
                    placeholder="3" 
                    type="number" 
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-500 sm:text-sm">Months</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">Job Description *</label>
              <div className="rounded-lg ring-1 ring-inset ring-slate-300 overflow-hidden bg-white">
                <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><Bold size={18} /></button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><Italic size={18} /></button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><Underline size={18} /></button>
                  <span className="w-px h-4 bg-slate-300 mx-1"></span>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><List size={18} /></button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><ListOrdered size={18} /></button>
                </div>
                <textarea 
                  className="block w-full border-0 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none px-4" 
                  placeholder="Describe the role and responsibilities..." 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">Requirements *</label>
              <div className="rounded-lg ring-1 ring-inset ring-slate-300 overflow-hidden bg-white">
                <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><Bold size={18} /></button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><Italic size={18} /></button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><Underline size={18} /></button>
                  <span className="w-px h-4 bg-slate-300 mx-1"></span>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><List size={18} /></button>
                  <button type="button" className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"><ListOrdered size={18} /></button>
                </div>
                <textarea 
                  className="block w-full border-0 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none px-4" 
                  placeholder="List the requirements for this position..." 
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  required
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-primary" />
              Compensation
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900">Salary Type</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {['Paid', 'Stipend', 'Unpaid'].map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input 
                        className="peer sr-only" 
                        name="salary-type" 
                        type="radio" 
                        value={type.toLowerCase()} 
                        checked={formData.salaryType === type.toLowerCase()}
                        onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                      />
                      <div className="rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-600 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary-dark transition-all">
                        {type}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {formData.salaryType !== 'unpaid' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="min-salary">Amount (USD)</label>
                    <div className="mt-2 relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-500 sm:text-sm">$</span>
                      </div>
                      <input 
                        className="block w-full rounded-lg border-0 py-2.5 pl-7 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                        id="min-salary" 
                        placeholder="150" 
                        type="number" 
                        value={formData.minSalary}
                        onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                        required={formData.salaryType !== 'unpaid'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              Skills & Logistics
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900">Required Skills</label>
                <div className="mt-2 relative">
                  <div className="min-h-[46px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
                      <span key={skill} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary-dark">
                        {skill}
                        <button 
                          className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-primary/20" 
                          type="button"
                          onClick={() => setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) })}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <input 
                      className="border-0 bg-transparent p-0 text-sm placeholder:text-slate-400 focus:ring-0 flex-1 min-w-[100px]" 
                      placeholder="Type and press Enter to add skills..." 
                      type="text" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !formData.skills.includes(val)) {
                            setFormData({ ...formData, skills: [...formData.skills, val] });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Press Enter to add a skill</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="positions">Positions Open</label>
                  <div className="mt-2 flex items-center">
                    <button 
                      className="flex h-10 w-10 items-center justify-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100" 
                      type="button"
                      onClick={() => setFormData({ ...formData, positions: Math.max(1, formData.positions - 1) })}
                    >
                      <Minus size={18} />
                    </button>
                    <input className="block h-10 w-full border-x-0 border-slate-300 bg-white text-center text-slate-900 focus:ring-0 sm:text-sm" id="positions" readOnly type="number" value={formData.positions} />
                    <button 
                      className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100" 
                      type="button"
                      onClick={() => setFormData({ ...formData, positions: formData.positions + 1 })}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="deadline">Application Deadline *</label>
                  <div className="mt-2 relative">
                    <input 
                      className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                      id="deadline" 
                      type="date" 
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-6 pb-20">
          <button 
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" 
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50" 
            type="submit"
            disabled={submitting}
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {isEditMode ? (submitting ? 'Updating...' : 'Update Internship') : (submitting ? 'Publishing...' : 'Publish Internship')}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Internship Post"
        message="Are you sure you want to delete this internship post? This action cannot be undone and all applicant data for this post will be archived."
        confirmText="Delete Post"
        type="danger"
      />
    </div>
  );
}
