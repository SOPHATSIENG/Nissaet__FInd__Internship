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
  Trash2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/company-components/ConfirmationModal';

export default function PostInternship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    location: 'Phnom Penh',
    duration: '',
    description: '',
    requirements: '',
    salaryType: 'paid',
    minSalary: '',
    maxSalary: '',
    skills: ['Social Media', 'Copywriting'],
    positions: 1,
    deadline: ''
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      // Mock fetching data for the internship
      setFormData({
        title: 'Marketing Intern',
        location: 'Phnom Penh',
        duration: '3',
        description: 'We are looking for a creative Marketing Intern to join our team...',
        requirements: 'Currently enrolled in a Marketing or related degree...',
        salaryType: 'paid',
        minSalary: '150',
        maxSalary: '300',
        skills: ['Social Media', 'Copywriting', 'Content Strategy'],
        positions: 2,
        deadline: '2023-12-31'
      });
    }
  }, [id, isEditMode]);

  const handleDelete = () => {
    // In a real application, this would call an API to delete the post
    console.log(`Deleting internship post with ID: ${id}`);
    setIsDeleteModalOpen(false);
    navigate('/company');
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 md:px-6 flex flex-col gap-8">
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
          <button className="px-4 py-2 text-sm font-semibold text-background-dark bg-primary rounded-lg shadow-sm hover:bg-primary-dark transition-all">
            Save Draft
          </button>
        </div>
      </div>

      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Info size={20} className="text-primary" />
            Basic Information
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="title">Internship Title</label>
              <div className="mt-2">
                <input 
                  className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                  id="title" 
                  placeholder="e.g. Junior Marketing Intern" 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="location">Location (Province)</label>
                <div className="mt-2">
                  <select 
                    className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="duration">Duration</label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <input 
                    className="block w-full rounded-lg border-0 py-2.5 pr-12 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                    id="duration" 
                    placeholder="3" 
                    type="text" 
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-500 sm:text-sm">Months</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">Job Description</label>
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
                  className="block w-full border-0 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none" 
                  placeholder="Describe the role and responsibilities..." 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">Requirements</label>
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
                  className="block w-full border-0 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none" 
                  placeholder="List the requirements for this position..." 
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="min-salary">Min Amount</label>
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
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="max-salary">Max Amount</label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      className="block w-full rounded-lg border-0 py-2.5 pl-7 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                      id="max-salary" 
                      placeholder="300" 
                      type="number" 
                      value={formData.maxSalary}
                      onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                    />
                  </div>
                </div>
              </div>
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
                      placeholder="Type to search skills..." 
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
                  <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="deadline">Application Deadline</label>
                  <div className="mt-2 relative">
                    <input 
                      className="block w-full rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
                      id="deadline" 
                      type="date" 
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
          >
            Cancel
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-background-dark shadow-sm hover:bg-primary-dark transition-all" type="submit">
            <Send size={20} />
            {isEditMode ? 'Update Internship' : 'Publish Internship'}
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
