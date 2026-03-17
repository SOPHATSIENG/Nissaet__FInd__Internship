import React from 'react';

interface BlogFilterProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const BlogFilter: React.FC<BlogFilterProps> = ({ activeFilter, onFilterChange }) => {
    const filters = [
        { label: 'All Content', value: 'all' },
        { label: 'Internships', value: 'internship' },
        { label: 'Workshops', value: 'workshop' },
        { label: 'Career Fairs', value: 'career_fair' },
        { label: 'Articles', value: 'article' },
    ];

    return (
        <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((filter) => (
                <button
                    key={filter.value}
                    onClick={() => onFilterChange(filter.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                        activeFilter === filter.value
                            ? 'bg-[#137fec] text-white border-[#137fec] shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#137fec] hover:text-[#137fec]'
                    }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};

export default BlogFilter;
