import React from 'react';
import { Calendar, MapPin, Building2, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Post {
    id: number;
    title: string;
    content: string;
    short_description: string;
    image_url: string;
    post_type: 'internship' | 'workshop' | 'career_fair' | 'article';
    company_name: string;
    company_logo: string;
    location: string;
    event_date: string;
    created_at: string;
}

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'internship': return 'bg-blue-100 text-blue-700';
            case 'workshop': return 'bg-purple-100 text-purple-700';
            case 'career_fair': return 'bg-emerald-100 text-emerald-700';
            case 'article': return 'bg-orange-100 text-orange-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
            {post.image_url && (
                <div className="relative h-48 overflow-hidden">
                    <img 
                        src={post.image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getBadgeColor(post.post_type)}`}>
                            {post.post_type.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            )}

            <div className="p-5 flex flex-col flex-grow">
                {!post.image_url && (
                    <div className="mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getBadgeColor(post.post_type)}`}>
                            {post.post_type.replace('_', ' ')}
                        </span>
                    </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-[#137fec] transition-colors">
                    {post.title}
                </h3>
                
                <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
                    {post.short_description || post.content.substring(0, 150) + '...'}
                </p>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center text-slate-500 text-sm">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span className="font-medium text-slate-700">{post.company_name}</span>
                    </div>
                    {post.location && (
                        <div className="flex items-center text-slate-500 text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{post.location}</span>
                        </div>
                    )}
                    {post.event_date && (
                        <div className="flex items-center text-[#137fec] text-sm font-medium">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Event: {formatDate(post.event_date)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-slate-400 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDate(post.created_at)}</span>
                    </div>
                    <Link 
                        to={`/student/blog/${post.id}`}
                        className="flex items-center text-sm font-semibold text-[#137fec] hover:underline"
                    >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
