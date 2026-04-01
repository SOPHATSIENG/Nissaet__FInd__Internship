import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Calendar, MapPin, Building2, Clock, ArrowLeft, 
    Share2, Bookmark, Loader2, User, ChevronRight 
} from 'lucide-react';
import api from '../../api/axios';
import { Post } from '../../components/student-components/PostCard';

const BlogDetail: React.FC = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://3.236.242.186.nip.io/api';
    const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<(Post & { related_posts: any[], company_description?: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                setLoading(true);
                const response = await api.getPostById(id || '');
                if (response && response.success) {
                    setPost(response.data);
                } else if (response) {
                    setPost(response);
                }
            } catch (err) {
                console.error('Error fetching post detail:', err);
                setError('Could not find the post you are looking for.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPostDetail();
    }, [id]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
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
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-[#137fec] animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading content...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 mb-6">
                    {error || 'Post not found'}
                </div>
                <button 
                    onClick={() => navigate('/blog')}
                    className="inline-flex items-center text-[#137fec] font-semibold hover:underline"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Blog
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-slate-500 mb-8">
                <Link to="/" className="hover:text-[#137fec]">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <Link to="/blog" className="hover:text-[#137fec]">Blog</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-slate-900 font-medium truncate max-w-[200px] md:max-w-md">
                    {post.title}
                </span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <button 
                        onClick={() => navigate(-1)}
                        className="mb-6 inline-flex items-center text-slate-600 hover:text-[#137fec] transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </button>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        {resolveImageUrl(post.image_url) && (
                            <div className="w-full h-80 md:h-[450px]">
                                <img 
                                    src={resolveImageUrl(post.image_url)} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df7f?w=1200&h=400&fit=crop';
                                    }}
                                />
                            </div>
                        )}

                        <div className="p-6 md:p-10">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                                    {post.post_type}
                                </span>
                                <div className="flex items-center text-slate-400 text-sm ml-auto">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatDate(post.created_at)}
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 mr-3 overflow-hidden">
                                        {resolveImageUrl(post.company_logo) ? (
                                            <img src={resolveImageUrl(post.company_logo)} alt={post.company_name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-medium">Posted by</div>
                                        <div className="text-sm font-bold text-slate-900">{post.company_name}</div>
                                    </div>
                                </div>
                                
                                {post.location && (
                                    <div className="flex items-center text-slate-600">
                                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                        <span className="text-sm font-medium">{post.location}</span>
                                    </div>
                                )}

                                {post.event_date && (
                                    <div className="flex items-center text-[#137fec]">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-bold">Event Date: {formatDate(post.event_date)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <div className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                                    {post.content}
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex gap-2">
                                    <button className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-semibold transition-all">
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </button>
                                    <button className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-semibold transition-all">
                                        <Bookmark className="w-4 h-4 mr-2" />
                                        Save
                                    </button>
                                </div>

                                {post.post_type === 'internship' ? (
                                    <Link 
                                        to={`/internships`}
                                        className="px-8 py-3 bg-[#137fec] text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-[#1171d1] transition-all"
                                    >
                                        Apply Now
                                    </Link>
                                ) : (
                                    <button 
                                        className="px-8 py-3 bg-[#137fec] text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-[#1171d1] transition-all"
                                    >
                                        Register Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Company Info */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">About Company</h3>
                        <div className="flex items-center mb-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mr-4">
                                {resolveImageUrl(post.company_logo) ? (
                                    <img src={resolveImageUrl(post.company_logo)} alt={post.company_name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <div className="font-bold text-slate-900">{post.company_name}</div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6 line-clamp-4 leading-relaxed">
                            {post.company_description || "No description available for this company."}
                        </p>
                        <Link 
                            to={`/companies`}
                            className="w-full block text-center py-2 text-sm font-bold text-[#137fec] border border-[#137fec]/20 rounded-xl hover:bg-blue-50 transition-all"
                        >
                            View Company Profile
                        </Link>
                    </div>

                    {/* Related Posts */}
                    {post.related_posts && post.related_posts.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                Related Content
                            </h3>
                            <div className="space-y-4">
                                {post.related_posts.map((related) => (
                                    <Link 
                                        key={related.id} 
                                        to={`/blog/${related.id}`}
                                        className="flex gap-4 p-3 bg-white rounded-2xl border border-slate-100 hover:border-[#137fec]/30 hover:shadow-md transition-all group"
                                    >
                                        {resolveImageUrl(related.image_url) && (
                                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                                <img
                                                    src={resolveImageUrl(related.image_url)}
                                                    alt={related.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df7f?w=800&h=400&fit=crop';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[10px] font-bold text-[#137fec] uppercase tracking-wider mb-1">
                                                {related.post_type}
                                            </span>
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#137fec]">
                                                {related.title}
                                            </h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;


