import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Calendar, MapPin, Building2, ArrowRight, Clock } from 'lucide-react';
import api from '../../api/axios';
import BlogFilter from '../../components/student-components/BlogFilter';
import { Input } from '../../components/Input';
import { Link } from 'react-router-dom';

interface EventItem {
    id: number;
    title: string;
    description: string;
    type: string;
    event_date: string;
    location: string;
    image_url?: string;
    company_name: string;
    company_logo?: string;
    created_at: string;
}

const BlogList: React.FC = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('events');
    const [search, setSearch] = useState('');

    const fetchEvents = useCallback(async (currentFilter = filter, currentSearch = search) => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams();
            if (currentSearch) params.set('search', currentSearch);
            if (currentFilter && currentFilter !== 'events') params.set('type', currentFilter);
            const query = params.toString();
            const response = await api.get(`/events${query ? `?${query}` : ''}`, { auth: false });
            const list = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : [];
            setEvents(list as EventItem[]);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events. Please try again later.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents(filter, search);
    }, [fetchEvents, filter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEvents(filter, search);
    };

    const formatDate = (value?: string) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const resolveImageUrl = (value?: string) => {
        if (!value) return '';
        const trimmed = String(value).trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('data:')) return trimmed;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://3.236.242.186.nip.io/api';
        const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
        return `${API_ORIGIN}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header Section */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    Student Blog & <span className="text-[#137fec]">Events</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Stay updated with the latest internship opportunities, workshops, career fairs, and expert career advice.
                </p>
            </div>

            {/* Search and Filter Section */}
            <div className="flex justify-center mb-10">
                <div className="w-full max-w-2xl">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                        <div className="flex-grow">
                            <Input
                                label=""
                                placeholder="Search by title, company, or keywords..."
                                icon={Search}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            className="h-[52px] px-6 bg-[#137fec] text-white rounded-lg font-semibold hover:bg-[#1171d1] transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <BlogFilter activeFilter={filter} onFilterChange={setFilter} />

            {/* Content Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-[#137fec] animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading events...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
                    {error}
                </div>
            ) : events.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No events found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your search or filter.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => {
                            const imageUrl = resolveImageUrl(event.image_url || event.company_logo);
                            return (
                                <div key={event.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
                                    {imageUrl && (
                                        <div className="relative h-48 overflow-hidden">
                                            <img 
                                                src={imageUrl} 
                                                alt={event.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df7f?w=800&h=400&fit=crop';
                                                }}
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-700">
                                                    {(event.type || 'event').replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5 flex flex-col flex-grow">
                                        {!imageUrl && (
                                            <div className="mb-3">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-700">
                                                    {(event.type || 'event').replace('_', ' ')}
                                                </span>
                                            </div>
                                        )}

                                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-[#137fec] transition-colors">
                                            {event.title}
                                        </h3>
                                        
                                        <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
                                            {event.description}
                                        </p>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <Building2 className="w-4 h-4 mr-2" />
                                                <span className="font-medium text-slate-700">{event.company_name}</span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center text-slate-500 text-sm">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    <span>{event.location}</span>
                                                </div>
                                            )}
                                            {event.event_date && (
                                                <div className="flex items-center text-[#137fec] text-sm font-medium">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    <span>Event: {formatDate(event.event_date)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center text-slate-400 text-xs">
                                                <Clock className="w-3 h-3 mr-1" />
                                                <span>{formatDate(event.created_at)}</span>
                                            </div>
                                            <Link 
                                                to={`/events/${event.id}`}
                                                className="flex items-center text-sm font-semibold text-[#137fec] hover:underline"
                                            >
                                                Read More
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default BlogList;


