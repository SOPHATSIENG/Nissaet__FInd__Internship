import React, { useEffect, useState, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Globe, 
  Tag, 
  Image, 
  Send,
  Edit,
  Trash2,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Video,
  UserCheck
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmationModal from '../../components/company-components/ConfirmationModal';

interface EventFormData {
  title: string;
  description: string;
  type: 'workshop' | 'seminar' | 'webinar' | 'competition' | 'networking' | 'other';
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_virtual: boolean;
  meeting_url: string;
  max_participants: string;
  registration_deadline: string;
  requirements: string;
  tags: string;
  image_url: string;
  status: 'draft' | 'published';
}

export default function PostEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id && id !== 'undefined' && id !== 'null';

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'workshop',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_virtual: false,
    meeting_url: '',
    max_participants: '',
    registration_deadline: '',
    requirements: '',
    tags: '',
    image_url: '',
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'competition', label: 'Competition' },
    { value: 'networking', label: 'Networking Event' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchEvent();
    }
  }, [id, isEditMode]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      const event = response.data;
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'workshop',
        event_date: event.event_date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        location: event.location || '',
        is_virtual: event.is_virtual || false,
        meeting_url: event.meeting_url || '',
        max_participants: event.max_participants?.toString() || '',
        registration_deadline: event.registration_deadline || '',
        requirements: event.requirements || '',
        tags: event.tags || '',
        image_url: event.image_url || '',
        status: event.status || 'draft'
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.event_date) return 'Event date is required';
    if (!formData.start_time) return 'Start time is required';
    if (!formData.end_time) return 'End time is required';
    if (formData.is_virtual && !formData.meeting_url.trim()) {
      return 'Meeting URL is required for virtual events';
    }
    if (!formData.is_virtual && !formData.location.trim()) {
      return 'Location is required for in-person events';
    }
    if (!formData.registration_deadline) return 'Registration deadline is required';
    return null;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const toNull = (value: string) => (value && value.trim().length > 0 ? value : null);
      const submitData = {
        title: formData.title,
        description: formData.description,
        type: formData.type || 'workshop',
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.is_virtual ? null : toNull(formData.location),
        is_virtual: Boolean(formData.is_virtual),
        meeting_url: formData.is_virtual ? toNull(formData.meeting_url) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: toNull(formData.registration_deadline),
        requirements: toNull(formData.requirements),
        tags: toNull(formData.tags),
        image_url: toNull(formData.image_url),
        status
      };

      if (isEditMode) {
        await api.put(`/events/${id}`, submitData);
        setSuccess(status === 'published' ? 'Event published successfully!' : 'Event saved as draft!');
        navigate('/company/events');
      } else {
        await api.post('/events', submitData);
        setSuccess(status === 'published' ? 'Event created and published successfully!' : 'Event saved as draft!');
        navigate('/company/events');
      }
    } catch (error: any) {
      console.error('Error submitting event:', error);
      setError(error?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${id}`);
      navigate('/company/events');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError(error?.message || 'Failed to delete event');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1000 * 1024) {
      setError('Image size must be less than 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image_url: String(reader.result || '') }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Event' : 'Create New Event'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode ? 'Update your event details' : 'Fill in the details to create a new event'}
              </p>
            </div>
            {isEditMode && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              placeholder="Describe your event, what participants will learn, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Event Date *
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                End Time *
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_virtual"
                id="is_virtual"
                checked={formData.is_virtual}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#137fec] border-gray-300 rounded focus:ring-[#137fec]"
              />
              <label htmlFor="is_virtual" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Video className="w-4 h-4" />
                Virtual Event
              </label>
            </div>

            {formData.is_virtual ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline w-4 h-4 mr-1" />
                  Meeting URL *
                </label>
                <input
                  type="url"
                  name="meeting_url"
                  value={formData.meeting_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                  placeholder="https://zoom.us/meeting/..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                  placeholder="Enter event location"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Max Participants
              </label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Registration Deadline *
              </label>
              <input
                type="date"
                name="registration_deadline"
                value={formData.registration_deadline}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                max={formData.event_date}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              placeholder="Any prerequisites or requirements for participants"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline w-4 h-4 mr-1" />
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              placeholder="programming, design, business (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="inline w-4 h-4 mr-1" />
              Event Image
            </label>
            <div className="space-y-3">
              {formData.image_url ? (
                <div className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={formData.image_url}
                    alt="Event"
                    className="h-40 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-600 shadow hover:bg-white"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  No image selected
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Image className="h-4 w-4" />
                  Upload Image
                </button>
                <span className="text-xs text-gray-500">PNG, JPG, GIF up to 1MB</span>
              </div>

              <div className="text-xs text-gray-500">
                Or paste an image URL below.
              </div>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                placeholder="https://example.com/event-image.jpg"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Edit className="w-4 h-4" />
              )}
              Save as Draft
            </button>

            <button
              onClick={() => handleSubmit('published')}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-[#0e6bb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isEditMode ? 'Update Event' : 'Publish Event'}
            </button>

            {isEditMode && (
              <button
                onClick={() => navigate('/company/events')}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
