import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Globe,
  Video,
  UserPlus,
  UserCheck,
  X,
  Tag,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Building,
  Phone,
  Mail,
  Globe as WebsiteIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

interface Event {
  id: number;
  company_id: number;
  company_profile_id?: number | null;
  title: string;
  description: string;
  type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_virtual: boolean;
  meeting_url: string;
  registration_url: string;
  max_participants: number;
  current_participants: number;
  registration_deadline: string;
  requirements: string;
  tags: string;
  image_url: string;
  status: string;
  created_at: string;
  company_name: string;
  company_logo: string;
  industry: string;
  company_location: string;
  website: string;
  company_description?: string;
  userRegistration?: {
    id: number;
    registration_date: string;
    status: string;
  };
}

export default function EventDetails() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, user?.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await api.get(`/events/${id}`, { auth: !!user });
      const payload = response?.data ?? response;
      const resolvedEvent = payload?.event ?? payload?.data ?? payload;
      setEvent(resolvedEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
      setLoadError((error as any)?.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!event) return;

    try {
      setRegistering(true);
      setActionError('');
      setSuccess('');

      await api.post(`/events/${event.id}/register`, {});
      
      setSuccess('Successfully registered for the event!');
      setEvent({
        ...event,
        current_participants: (event.current_participants || 0) + 1,
        userRegistration: {
          id: 0,
          registration_date: new Date().toISOString(),
          status: 'registered'
        }
      });
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      const message =
        error?.message ||
        error?.error ||
        (typeof error === 'string' ? error : '') ||
        'Failed to register for event';
      setActionError(message);
      setTimeout(() => setActionError(''), 5000);
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!event) return;

    try {
      setRegistering(true);
      setActionError('');
      setSuccess('');

      await api.delete(`/events/${event.id}/register`);
      
      setSuccess('Successfully unregistered from the event!');
      setEvent({
        ...event,
        current_participants: Math.max(0, (event.current_participants || 0) - 1),
        userRegistration: undefined
      });
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Error unregistering from event:', error);
      const message =
        error?.message ||
        error?.error ||
        (typeof error === 'string' ? error : '') ||
        'Failed to unregister from event';
      setActionError(message);
      setTimeout(() => setActionError(''), 5000);
    } finally {
      setRegistering(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      workshop: 'Workshop',
      seminar: 'Seminar',
      webinar: 'Webinar',
      competition: 'Competition',
      networking: 'Networking Event',
      other: 'Other'
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isRegistrationOpen = (deadline: string) => {
    return new Date(deadline) > new Date();
  };

  const isEventFull = (current: number, max: number) => {
    return max && current >= max;
  };

  const resolveImageUrl = (value?: string) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `${API_ORIGIN}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  if (!event || loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Event</h2>
          <p className="text-gray-600 mb-4">
            {loadError || "The event you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0e6bb8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Alerts */}
      {actionError && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          {actionError}
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {resolveImageUrl(event.image_url || event.company_logo) && (
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={resolveImageUrl(event.image_url || event.company_logo)} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df7f?w=1200&h=400&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                  <div className="flex items-center gap-2 text-white">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      {getTypeLabel(event.type)}
                    </span>
                    {event.userRegistration && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-sm">
                        <CheckCircle className="w-3 h-3" />
                        Registered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
                  <p className="text-lg text-gray-600">{event.company_name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.status === 'published' ? 'Active' : event.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-[#137fec]" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm">{formatDate(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-[#137fec]" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  {event.is_virtual ? (
                    <>
                      <Video className="w-5 h-5 text-[#137fec]" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm">Virtual Event</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 text-[#137fec]" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm">{event.location}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="w-5 h-5 text-[#137fec]" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-sm">
                      {event.current_participants || 0}
                      {event.max_participants && ` / ${event.max_participants}`} registered
                    </p>
                  </div>
                </div>
              </div>

              {event.registration_deadline && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">Registration Deadline</p>
                    <p className="text-sm text-amber-700">{formatDate(event.registration_deadline)}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>

              {event.requirements && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{event.requirements}</p>
                  </div>
                </div>
              )}

              {event.tags && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.split(',').map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        <Tag className="w-3 h-3" />
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.is_virtual && event.meeting_url && event.userRegistration && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Meeting Link</p>
                      <p className="text-sm text-blue-700">Join the virtual event</p>
                    </div>
                    <a
                      href={event.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Event
                    </a>
                  </div>
                </div>
              )}

              {event.registration_url && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-indigo-900">Registration Link</p>
                      <p className="text-sm text-indigo-700">Open the company registration form for this event.</p>
                    </div>
                    <a
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Link
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration</h3>
            
            {!isRegistrationOpen(event.registration_deadline) ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Registration for this event has closed.</p>
              </div>
            ) : isEventFull(event.current_participants || 0, event.max_participants) ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">This event is full.</p>
              </div>
            ) : event.userRegistration ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">You are registered for this event</p>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Registered on {formatDate(event.userRegistration.registration_date)}
                  </p>
                </div>
                <button
                  onClick={handleUnregister}
                  disabled={registering}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Cancel Registration
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Registration Link
                  </a>
                )}
                {user && user.role === 'student' ? (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-[#0e6bb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Register for Event
                  </button>
                ) : user ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800">Only students can register for events.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-[#0e6bb8] transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign In to Register
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Organizer</h3>
            <div className="text-center mb-4">
              {resolveImageUrl(event.company_logo) ? (
                <img 
                  src={resolveImageUrl(event.company_logo)} 
                  alt={event.company_name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(event.company_name) + '&background=137fec&color=fff&size=80';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gray-200 flex items-center justify-center">
                  <Building className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <h4 className="font-semibold text-gray-900">{event.company_name}</h4>
              <p className="text-sm text-gray-600">{event.industry}</p>
              {event.company_description && (
                <p className="mt-2 text-xs text-gray-500">{event.company_description}</p>
              )}
            </div>

            {event.company_location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                {event.company_location}
              </div>
            )}

            {event.website && (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#137fec] hover:underline mb-4"
              >
                <WebsiteIcon className="w-4 h-4" />
                Visit Website
              </a>
            )}

            <button
              onClick={() => {
                const targetId = event.company_profile_id || event.company_id;
                const query = event.company_profile_id ? '' : '?by=user';
                navigate(`/companies/${targetId}${query}`, {
                  state: {
                    eventId: event.id,
                    companyFallback: {
                      company_name: event.company_name,
                      logo: event.company_logo,
                      industry: event.industry,
                      location: event.company_location,
                      website: event.website,
                    },
                  },
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              View Company Profile
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type</span>
                <span className="font-medium">{getTypeLabel(event.type)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="font-medium capitalize">{event.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Posted</span>
                <span className="font-medium">{formatDate(event.created_at)}</span>
              </div>
              {event.max_participants && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium">{event.max_participants} people</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

