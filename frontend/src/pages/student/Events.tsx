import React, { useEffect, useState } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Globe,
  Search,
  Filter,
  Video,
  UserPlus,
  UserCheck,
  Bell,
  X,
  Tag,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
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
  userRegistration?: {
    id: number;
    registration_date: string;
    status: string;
  };
}

export default function Events() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://3.236.242.186.nip.io/api';
  const API_ORIGIN = API_BASE_URL.replace(/\https://3.236.242.186.nip.io/api\/?$/, '');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { unreadCount } = useNotifications();
  const notificationCount = Math.max(0, unreadCount || 0);

  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'competition', label: 'Competition' },
    { value: 'networking', label: 'Networking' },
    { value: 'career_fair', label: 'Career Fair' },
    { value: 'other', label: 'Other' }
  ];

  const resolveImageUrl = (value?: string) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `${API_ORIGIN}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.getUpcomingEvents();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setEvents(list);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setRegisteringId(eventId);
      setError('');
      setSuccess('');

      await api.post(`/events/${eventId}/register`, {});
      
      setSuccess('Successfully registered for the event!');
      
      // Update the events list to reflect registration
      setEvents((previous) => previous.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              current_participants: (event.current_participants || 0) + 1,
              userRegistration: {
                id: 0,
                registration_date: new Date().toISOString(),
                status: 'registered'
              }
            }
          : event
      ));
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      const message =
        error?.message ||
        error?.error ||
        (typeof error === 'string' ? error : '') ||
        'Failed to register for event';
      setError(message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleUnregister = async (eventId: number) => {
    try {
      setRegisteringId(eventId);
      setError('');
      setSuccess('');

      await api.delete(`/events/${eventId}/register`);
      
      setSuccess('Successfully unregistered from the event!');
      
      // Update the events list to reflect unregistration
      setEvents((previous) => previous.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              current_participants: Math.max(0, (event.current_participants || 0) - 1),
              userRegistration: undefined
            }
          : event
      ));
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Error unregistering from event:', error);
      const message =
        error?.message ||
        error?.error ||
        (typeof error === 'string' ? error : '') ||
        'Failed to unregister from event';
      setError(message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setRegisteringId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType ? eventType.label : type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const isRegistrationOpen = (registrationDeadline: string) => {
    return new Date(registrationDeadline) > new Date();
  };

  const isEventFull = (current: number, max: number) => {
    return max && current >= max;
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesLocation = !locationFilter || 
                          event.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
                          event.company_name.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const EventCard = ({ event, isFeatured = false }: { event: Event; isFeatured?: boolean }) => {
    const imageUrl = resolveImageUrl(event.image_url || event.company_logo);
    return (
    <div className={`bg-white rounded-lg border ${isFeatured ? 'border-blue-200 shadow-md' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
      {imageUrl && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df7f?w=800&h=400&fit=crop';
            }}
          />
          {isFeatured && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                Featured
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
              {event.userRegistration && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Registered
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{event.company_name} - {event.industry}</p>
          </div>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.event_date)}</span>
            <span className="text-gray-400">-</span>
            <Clock className="w-4 h-4" />
            <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            {event.is_virtual ? (
              <>
                <Video className="w-4 h-4" />
                <span>Virtual Event</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{event.current_participants || 0} participants</span>
            {event.max_participants && (
              <span className="text-gray-400">- {event.max_participants} max</span>
            )}
          </div>

          {event.registration_deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Register by {formatDate(event.registration_deadline)}</span>
            </div>
          )}
        </div>

        {event.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.split(',').slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                <Tag className="w-3 h-3" />
                {tag.trim()}
              </span>
            ))}
            {event.tags.split(',').length > 3 && (
              <span className="text-xs text-gray-500">+{event.tags.split(',').length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/events/${event.id}`)}
            className="flex items-center gap-1 px-4 py-2 text-[#137fec] hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            Read More
            <ChevronRight className="w-4 h-4" />
          </button>

          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Registration Link
            </a>
          )}

          {user && user.role === 'student' && (
            <>
              {event.userRegistration ? (
                <button
                  onClick={() => handleUnregister(event.id)}
                  disabled={registeringId === event.id}
                  className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {registeringId === event.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Cancel Registration
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(event.id)}
                  disabled={registeringId === event.id || !isRegistrationOpen(event.registration_deadline) || isEventFull(event.current_participants || 0, event.max_participants)}
                  className="flex items-center gap-1 px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0e6bb8] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registeringId === event.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Register Now
                </button>
              )}
            </>
          )}

          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1 px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0e6bb8] transition-colors text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Register Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <button
          type="button"
          className="absolute right-0 top-0 inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Events & Workshops</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover and register for workshops, seminars, and networking events hosted by top companies
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg max-w-2xl mx-auto">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="City or company name"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All Events */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Upcoming Events</h2>
        {filteredEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {searchTerm || typeFilter !== 'all' || locationFilter
                ? 'Try adjusting your filters or search terms'
                : 'Check back later for new events and workshops'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

