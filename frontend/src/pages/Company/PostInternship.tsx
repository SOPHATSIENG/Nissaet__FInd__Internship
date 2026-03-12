import React, { useEffect, useState, useRef } from 'react';
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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const validate = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.duration) return 'Duration is required';
    if (!formData.deadline) return 'Deadline is required';
    if (formData.salaryType !== 'unpaid' && !formData.minSalary) return 'Salary amount is required';
    return null;
  };

  const descriptionRef = useRef(null);
  const requirementsRef = useRef(null);
  const [showPreview, setShowPreview] = useState({ description: false, requirements: false });

  useEffect(() => {
    if (isEditMode) {
      fetchInternshipData();
    }
  }, [id, isEditMode]);

  const fetchInternshipData = async () => {
    try {
      setLoading(true);
      const response = await api.getInternshipById(id);
      const internship = response.internship;
      
      if (internship) {
        setFormData({
          title: internship.title || '',
          location: internship.location || 'Phnom Penh',
          duration: internship.duration_months?.toString() || '',
          description: internship.description || '',
          requirements: internship.requirements || '',
          salaryType: internship.stipend > 0 ? 'paid' : 'unpaid',
          minSalary: internship.stipend ? internship.stipend.toString() : '',
          maxSalary: internship.stipend ? internship.stipend.toString() : '',
          skills: [], // Will be populated separately if needed
          positions: internship.positions || 1,
          deadline: internship.application_deadline ? internship.application_deadline.split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Error fetching internship data:', error);
      alert('Failed to load internship data. Please try again.');
      navigate('/company');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteInternship(id);
      setIsDeleteModalOpen(false);
      navigate('/company');
    } catch (error) {
      console.error('Error deleting internship:', error);
      alert('Failed to delete internship. Please try again.');
    }
  };

  const formatText = (command, textareaRef) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (!selectedText) {
      textarea.focus();
      return;
    }

    let newText = selectedText;

    switch (command) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'underline':
        newText = `__${selectedText}__`;
        break;
      case 'unorderedList':
        newText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'orderedList':
        newText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
      default:
        return;
    }

    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    
    if (textarea === descriptionRef.current) {
      setFormData({ ...formData, description: newValue });
    } else if (textarea === requirementsRef.current) {
      setFormData({ ...formData, requirements: newValue });
    }
    
    setTimeout(() => {
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Simple markdown rendering
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return html;
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
        const response = await api.updateInternship(id, payload);
        console.log('Update response:', response);
      } else {
        await api.createInternship(payload);
      }
      navigate('/company');
    } catch (error) {
      console.error('Error submitting internship:', error);
      const action = isEditMode ? 'updating' : 'creating';
      alert(`Failed to ${action} internship: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
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
      {isEditMode && loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
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
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
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
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
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
                    className="block w-full rounded-lg border-0 py-2.5 pr-12 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6" 
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
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                Job Description
                <button 
                  type="button"
                  onClick={() => setShowPreview({ ...showPreview, description: !showPreview.description })}
                  className="ml-2 text-xs text-primary hover:text-primary-dark transition-colors"
                >
                  {showPreview.description ? 'Edit' : 'Preview'}
                </button>
              </label>
              <div className="rounded-lg ring-1 ring-inset ring-slate-300 overflow-hidden bg-white">
                <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <button 
                    type="button" 
                    onClick={() => formatText('bold', descriptionRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Bold"
                  >
                    <Bold size={18} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => formatText('italic', descriptionRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Italic"
                  >
                    <Italic size={18} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => formatText('underline', descriptionRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Underline"
                  >
                    <Underline size={18} />
                  </button>
                  <span className="w-px h-4 bg-slate-300 mx-1"></span>
                  <button 
                    type="button" 
                    onClick={() => formatText('unorderedList', descriptionRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Unordered List"
                  >
                    <List size={18} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => formatText('orderedList', descriptionRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Ordered List"
                  >
                    <ListOrdered size={18} />
                  </button>
                </div>
                {showPreview.description ? (
                  <div 
                    className="block w-full border-0 py-3 px-3 text-slate-900 sm:text-sm sm:leading-6 min-h-[100px]"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.description) }}
                  />
                ) : (
                  <textarea 
                    ref={descriptionRef}
                    className="block w-full border-0 py-3 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none" 
                    placeholder="Describe the role and responsibilities..." 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                Requirements
                <button 
                  type="button"
                  onClick={() => setShowPreview({ ...showPreview, requirements: !showPreview.requirements })}
                  className="ml-2 text-xs text-primary hover:text-primary-dark transition-colors"
                >
                  {showPreview.requirements ? 'Edit' : 'Preview'}
                </button>
              </label>
              <div className="rounded-lg ring-1 ring-inset ring-slate-300 overflow-hidden bg-white">
                <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <button 
                    type="button" 
                    onClick={() => formatText('bold', requirementsRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Bold"
                  >
                    <Bold size={18} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => formatText('italic', requirementsRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Italic"
                  >
                    <Italic size={18} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => formatText('underline', requirementsRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Underline"
                  >
                    <Underline size={18} />
                  </button>
                  <span className="w-px h-4 bg-slate-300 mx-1"></span>
                  <button 
                    type="button" 
                    onClick={() => formatText('unorderedList', requirementsRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Unordered List"
                  >
                    <List size={18} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => formatText('orderedList', requirementsRef)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                    title="Ordered List"
                  >
                    <ListOrdered size={18} />
                  </button>
                </div>
                {showPreview.requirements ? (
                  <div 
                    className="block w-full border-0 py-3 px-3 text-slate-900 sm:text-sm sm:leading-6 min-h-[100px]"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.requirements) }}
                  />
                ) : (
                  <textarea 
                    ref={requirementsRef}
                    className="block w-full border-0 py-3 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 resize-none" 
                    placeholder="List the requirements for this position..." 
                    rows={4}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  ></textarea>
                )}
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
                      <div className={`rounded-md border px-3 py-2 text-center text-sm font-medium transition-all cursor-pointer ${
                        formData.salaryType === type.toLowerCase()
                          ? 'border-primary bg-primary/5 text-primary-dark'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
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
        </>
      )}
    </div>
  );
}
