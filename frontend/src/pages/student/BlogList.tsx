import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import PostCard, { Post } from '../../components/student-components/PostCard';
import BlogFilter from '../../components/student-components/BlogFilter';
import { Input } from '../../components/Input';

const BlogList: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });

    const fetchPosts = async (page = 1, currentFilter = filter, currentSearch = search) => {
        try {
            setLoading(true);
            const response = await api.getPosts({
                page,
                type: currentFilter,
                search: currentSearch,
                limit: 9
            });
            
            if (response && response.success) {
                setPosts(response.data);
                setPagination(response.pagination);
            } else if (Array.isArray(response)) {
                setPosts(response);
                setPagination({ ...pagination, page, pages: 1, total: response.length });
            } else {
                setPosts([]);
                setPagination({ ...pagination, page, pages: 1, total: 0 });
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(1, filter, search);
    }, [filter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(1, filter, search);
    };

    const handlePageChange = (newPage: number) => {
        fetchPosts(newPage, filter, search);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="flex-grow max-w-xl">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-grow">
                            <Input
                                label="Search posts"
                                placeholder="Search by title, company, or keywords..."
                                icon={Search}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            className="h-[52px] px-6 bg-[#137fec] text-white rounded-lg font-semibold hover:bg-[#1171d1] transition-colors mt-[26px]"
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
                    <p className="text-slate-500 font-medium">Loading amazing content...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
                    {error}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No posts found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Previous
                            </button>
                            {[...Array(pagination.pages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                        pagination.page === i + 1
                                            ? 'bg-[#137fec] text-white'
                                            : 'border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BlogList;
