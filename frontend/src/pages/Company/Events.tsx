import React, { useEffect, useState } from 'react';
import { 
  Calendar,
  Clock,
  Loader2,
  MapPin,
  MoreVertical,
  Users,
  Globe,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Search,
  Filter,
  Video,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ConfirmationModal from '../../components/company-components/ConfirmationModal';

interface Event {
  id: number;
  title: string;
  description: string;
  type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_virtual: boolean;
  meeting_url: string;
  max_participants: number;
  current_participants: number;
  registration_deadline: string;
  requirements: string;
  tags: string;
  image_url: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  total_registrations: number;
}

interface EventStats {
  total_events: number;
  published_events: number;
  draft_events: number;
  completed_events: number;
  cancelled_events: number;
  total_participants: number;
  upcoming_events: number;
}

interface Registration {
  id: number;
  registration_date: string;
  status: string;
  notes?: string | null;
  student_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  university?: string | null;
  education?: string | null;
  graduation_year?: number | null;
  cv_url?: string | null;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDraftOnly, setShowDraftOnly] = useState(false);
  const [registrationsEvent, setRegistrationsEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState('');

  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'competition', label: 'Competition' },
    { value: 'networking', label: 'Networking' },
    { value: 'career_fair', label: 'Career Fair' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/events/company/mine');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Unable to load your event list right now.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/events/company/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      await api.delete(`/events/${selectedEvent.id}`);
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
      fetchStats();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const [error, setError] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700';
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      case 'completed':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const fetchRegistrations = async (eventItem: Event) => {
    try {
      setRegistrationsLoading(true);
      setRegistrationsError('');
      setRegistrationsEvent(eventItem);
      const response = await api.get(`/events/${eventItem.id}/registrations`);
      setRegistrations(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      setRegistrations([]);
      setRegistrationsError(error?.message || 'Failed to load registrations');
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const isPastDeadline = (deadline?: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) return false;
    deadlineDate.setHours(23, 59, 59, 999);
    return Date.now() > deadlineDate.getTime();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showDraftOnly
      ? event.status === 'draft'
      : (
          statusFilter === 'all'
            ? event.status !== 'draft'
            : statusFilter === 'draft'
              ? false
              : event.status === statusFilter
        );
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  const draftEventsCount = events.filter(event => event.status === 'draft').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Events & Workshops</h1>
          <p className="text-slate-500">Manage your company events and workshops</p>
        </div>
        <button
          onClick={() => navigate('/company/events/post')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Events</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total_events}</p>
              </div>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Published</p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.published_events}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Participants</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{stats.total_participants}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{stats.upcoming_events}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2 text-orange-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDraftOnly((prev) => {
                  const next = !prev;
                  if (next) {
                    setStatusFilter('all');
                  }
                  return next;
                });
              }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg ring-1 transition-all ${
                showDraftOnly
                  ? 'bg-primary text-white ring-primary/30'
                  : 'bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              Draft ({draftEventsCount})
            </button>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setShowDraftOnly(false);
              }}
              className="px-4 py-2.5 text-sm font-semibold bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg focus:ring-2 focus:ring-primary transition-all text-slate-700"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 text-sm font-semibold bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg focus:ring-2 focus:ring-primary transition-all text-slate-700"
            >
              <option value="all">All Types</option>
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-xl border border-slate-100 shadow-sm text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No events found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || showDraftOnly
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first event'}
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && !showDraftOnly && (
              <button
                onClick={() => navigate('/company/events/post')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all min-h-[280px]">
              <div className="flex h-full flex-col justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    {isPastDeadline(event.registration_deadline) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                        Expired
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold">
                      {getTypeLabel(event.type)}
                    </span>
                  </div>

                  <p className="text-slate-600 mb-4 line-clamp-3">{event.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div>
                    {event.is_virtual ? (
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        Virtual Event
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.current_participants || event.total_registrations || 0}
                      {event.max_participants && ` / ${event.max_participants}`} participants
                    </div>
                  </div>

                  {event.tags && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {event.tags.split(',').map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative mt-4 flex justify-end gap-1">
                  <button
                    onClick={() => setDetailEvent(event)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenuId === event.id && (
                    <div className="absolute right-0 top-11 z-10 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/company/events/post/${event.id}`);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="h-4 w-4" />
                        Edit event
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setSelectedEvent(event);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {detailEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative">
              {detailEvent.image_url ? (
                <img
                  src={detailEvent.image_url}
                  alt={detailEvent.title}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-400">
                  <Calendar className="w-12 h-12" />
                </div>
              )}
              <button
                onClick={() => setDetailEvent(null)}
                className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(detailEvent.status)}`}>
                  {getStatusIcon(detailEvent.status)}
                  {detailEvent.status.charAt(0).toUpperCase() + detailEvent.status.slice(1)}
                </span>
                {isPastDeadline(detailEvent.registration_deadline) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                    Expired
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {getTypeLabel(detailEvent.type)}
                </span>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{detailEvent.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Created on {formatDate(detailEvent.created_at)}</p>
              </div>

              <p className="whitespace-pre-wrap text-slate-600">{detailEvent.description}</p>

              <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(detailEvent.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{formatTime(detailEvent.start_time)} - {formatTime(detailEvent.end_time)}</span>
                </div>
                {detailEvent.is_virtual ? (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-slate-400" />
                    <span>Virtual event</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{detailEvent.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>
                    {detailEvent.current_participants || detailEvent.total_registrations || 0}
                    {detailEvent.max_participants && ` / ${detailEvent.max_participants}`} participants
                  </span>
                </div>
              </div>

              {detailEvent.registration_deadline && (
                <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                  Registration closes on {formatDate(detailEvent.registration_deadline)}.
                </div>
              )}

              {detailEvent.requirements && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Requirements</h4>
                  <p className="whitespace-pre-wrap text-sm text-slate-600">{detailEvent.requirements}</p>
                </div>
              )}

              {detailEvent.tags && (
                <div className="flex flex-wrap gap-2">
                  {detailEvent.tags.split(',').map((tag, index) => (
                    <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-1">
                <button
                  onClick={() => setDetailEvent(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (!detailEvent) return;
                    setDetailEvent(null);
                    fetchRegistrations(detailEvent);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Registrations
                </button>
                <button
                  onClick={() => {
                    setDetailEvent(null);
                    navigate(`/company/events/post/${detailEvent.id}`);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-all"
                >
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {registrationsEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Registrations</h3>
                <p className="text-sm text-slate-500">{registrationsEvent.title}</p>
              </div>
              <button
                onClick={() => {
                  setRegistrationsEvent(null);
                  setRegistrations([]);
                  setRegistrationsError('');
                }}
                className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                aria-label="Close registrations"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {registrationsError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {registrationsError}
                </div>
              )}

              {registrationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : registrations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No registrations yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Student</th>
                        <th className="py-2 pr-4 font-semibold">Email</th>
                        <th className="py-2 pr-4 font-semibold">University</th>
                        <th className="py-2 pr-4 font-semibold">Graduation</th>
                        <th className="py-2 pr-4 font-semibold">Registered</th>
                        <th className="py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="border-t border-slate-100">
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-slate-900">{registration.full_name}</div>
                            {registration.phone && (
                              <div className="text-xs text-slate-500">{registration.phone}</div>
                            )}
                          </td>
                          <td className="py-3 pr-4">{registration.email}</td>
                          <td className="py-3 pr-4">{registration.university || '-'}</td>
                          <td className="py-3 pr-4">{registration.graduation_year || '-'}</td>
                          <td className="py-3 pr-4">{formatDateTime(registration.registration_date)}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              {registration.status || 'registered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
