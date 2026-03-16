import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  X, 
  Plus, 
  Code, 
  Megaphone, 
  Briefcase, 
  Palette, 
  Cpu, 
  Globe, 
  Database, 
  PenTool, 
  Search as SearchIcon,
  Trash2,
  Edit2,
  ChevronRight,
  Settings2,
  Tag,
  Clock,
  ExternalLink,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const AVAILABLE_ICONS = [
  { name: 'LayoutGrid', icon: LayoutGrid },
  { name: 'Code', icon: Code },
  { name: 'Megaphone', icon: Megaphone },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Palette', icon: Palette },
  { name: 'Cpu', icon: Cpu },
  { name: 'Globe', icon: Globe },
  { name: 'Database', icon: Database },
  { name: 'PenTool', icon: PenTool },
  { name: 'Search', icon: SearchIcon },
];

const INITIAL_JOB_CATEGORIES = [
  { id: '1', name: 'Software Development', description: 'Web, mobile, and desktop app development.', icon: 'Code', count: 145 },
  { id: '2', name: 'Digital Marketing', description: 'SEO, SEM, social media, and content strategy.', icon: 'Megaphone', count: 82 },
  { id: '3', name: 'Business Admin', description: 'Management, HR, and office operations.', icon: 'Briefcase', count: 64 },
  { id: '4', name: 'UI/UX Design', description: 'User interface and experience design.', icon: 'Palette', count: 42 },
  { id: '5', name: 'Data Science', description: 'Machine learning and data analysis.', icon: 'Database', count: 28 },
  { id: '6', name: 'Cybersecurity', description: 'Network security and ethical hacking.', icon: 'Shield', count: 15 },
];

const INITIAL_SKILLS = [
  { id: '1', name: 'React.js', category: 'Software Development', popularity: 'High' },
  { id: '2', name: 'Node.js', category: 'Software Development', popularity: 'High' },
  { id: '3', name: 'SEO', category: 'Digital Marketing', popularity: 'Medium' },
  { id: '4', name: 'Figma', category: 'UI/UX Design', popularity: 'High' },
  { id: '5', name: 'Project Management', category: 'Business Admin', popularity: 'Medium' },
  { id: '6', name: 'Python', category: 'Software Development', popularity: 'High' },
  { id: '7', name: 'Adobe XD', category: 'UI/UX Design', popularity: 'Medium' },
  { id: '8', name: 'Google Ads', category: 'Digital Marketing', popularity: 'High' },
];

const INITIAL_JOB_TYPES = [
  { id: '1', name: 'Full-time', description: 'Standard 40-hour work week.' },
  { id: '2', name: 'Part-time', description: 'Less than 30 hours per week.' },
  { id: '3', name: 'Internship', description: 'Temporary position for students.' },
  { id: '4', name: 'Remote', description: 'Work from anywhere.' },
  { id: '5', name: 'Contract', description: 'Project-based employment.' },
];

export const CategoryManagement = () => {
  const [activeTab, setActiveTab] = useState<'Job Categories' | 'Skills' | 'Job Types'>('Job Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Data States
  const [jobCategories, setJobCategories] = useState(INITIAL_JOB_CATEGORIES);
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [jobTypes, setJobTypes] = useState(INITIAL_JOB_TYPES);

  // Form States for New Category
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('LayoutGrid');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [newSkillCategory, setNewSkillCategory] = useState('Software Development');

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'Job Categories') {
      return jobCategories.filter(c => c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query));
    } else if (activeTab === 'Skills') {
      return skills.filter(s => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query));
    } else {
      return jobTypes.filter(t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
    }
  }, [activeTab, searchQuery, jobCategories, skills, jobTypes]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    if (editingItem) {
      // Update existing item
      if (activeTab === 'Job Categories') {
        setJobCategories(jobCategories.map(c => c.id === editingItem.id ? { ...c, name: newName, description: newDescription, icon: selectedIconName } : c));
      } else if (activeTab === 'Skills') {
        setSkills(skills.map(s => s.id === editingItem.id ? { ...s, name: newName, category: newSkillCategory } : s));
      } else {
        setJobTypes(jobTypes.map(t => t.id === editingItem.id ? { ...t, name: newName, description: newDescription } : t));
      }
    } else {
      // Create new item
      const id = Math.random().toString(36).substr(2, 9);
      if (activeTab === 'Job Categories') {
        setJobCategories([...jobCategories, { id, name: newName, description: newDescription, icon: selectedIconName, count: 0 }]);
      } else if (activeTab === 'Skills') {
        setSkills([...skills, { id, name: newName, category: newSkillCategory, popularity: 'Low' }]);
      } else {
        setJobTypes([...jobTypes, { id, name: newName, description: newDescription }]);
      }
    }

    // Reset Form
    setNewName('');
    setNewDescription('');
    setSelectedIconName('LayoutGrid');
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewDescription(item.description || '');
    setSelectedIconName(item.icon || 'LayoutGrid');
    setNewSkillCategory(item.category || 'Software Development');
    setIsAddModalOpen(true);
    setSelectedDetailItem(null);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'Job Categories') {
      setJobCategories(jobCategories.filter(c => c.id !== id));
    } else if (activeTab === 'Skills') {
      setSkills(skills.filter(s => s.id !== id));
    } else {
      setJobTypes(jobTypes.filter(t => t.id !== id));
    }
  };

  const SelectedIcon = AVAILABLE_ICONS.find(i => i.name === selectedIconName)?.icon || LayoutGrid;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 overflow-y-auto no-scrollbar max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Category Management</h1>
          <p className="text-text-secondary text-base">Manage job industries, required skills, and employment types.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md transform active:scale-95"
        >
          <Plus className="size-4" />
          Add New {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {(['Job Categories', 'Skills', 'Job Types'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery('');
              }}
              className={cn(
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-colors relative",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              <div className="flex items-center gap-2">
                {tab === 'Job Categories' && <LayoutGrid className="size-4" />}
                {tab === 'Skills' && <Tag className="size-4" />}
                {tab === 'Job Types' && <Clock className="size-4" />}
                {tab}
              </div>
              <span className="ml-2 rounded-full bg-background border border-border px-2.5 py-0.5 text-[10px] font-black text-text-primary">
                {tab === 'Job Categories' ? jobCategories.length : tab === 'Skills' ? skills.length : jobTypes.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 group">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary size-4 group-focus-within:text-primary transition-colors" />
          <input 
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all" 
            placeholder={`Search ${activeTab.toLowerCase()}...`} 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-secondary hover:bg-background hover:text-primary transition-all"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <button className="flex items-center justify-center size-11 rounded-xl border border-border bg-surface text-text-secondary hover:text-primary hover:border-primary transition-all shadow-sm">
          <Settings2 className="size-5" />
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredData.map((item: any) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={cn(
                  "size-12 rounded-xl flex items-center justify-center border border-border bg-background shadow-inner group-hover:scale-110 transition-transform duration-300",
                  activeTab === 'Job Categories' ? "text-primary" : "text-indigo-500"
                )}>
                  {activeTab === 'Job Categories' ? (
                    (() => {
                      const Icon = AVAILABLE_ICONS.find(i => i.name === item.icon)?.icon || LayoutGrid;
                      return <Icon className="size-6" />;
                    })()
                  ) : activeTab === 'Skills' ? (
                    <Tag className="size-6" />
                  ) : (
                    <Clock className="size-6" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">{item.description}</p>
                )}
                {item.category && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-background px-2 py-1 rounded border border-border">
                      {item.category}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border",
                      item.popularity === 'High' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {item.popularity} Popularity
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeTab === 'Job Categories' ? (
                    <>
                      <Briefcase className="size-3 text-text-secondary" />
                      <span className="text-xs font-bold text-text-primary">{item.count} Listings</span>
                    </>
                  ) : (
                    <span className="text-xs text-text-secondary italic">Active in system</span>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedDetailItem(item)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                  View Details
                  <ChevronRight className="size-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredData.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="size-16 rounded-full bg-background border border-border flex items-center justify-center">
              <SearchIcon className="size-8 text-text-secondary opacity-20" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-text-primary">No results found</h3>
              <p className="text-sm text-text-secondary">Try adjusting your search or add a new {activeTab.toLowerCase().slice(0, -1)}.</p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDetailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailItem(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="relative w-full max-w-2xl bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]"
            >
              {/* Left Side - Visual Header */}
              <div className="w-full md:w-1/3 bg-primary/5 border-r border-border p-8 flex flex-col items-center justify-center gap-6 text-center">
                <div className="size-24 rounded-3xl bg-surface border border-border flex items-center justify-center shadow-xl group">
                  {(() => {
                    const Icon = AVAILABLE_ICONS.find(i => i.name === selectedDetailItem.icon)?.icon || 
                                (activeTab === 'Skills' ? Tag : Clock);
                    return <Icon className="size-12 text-primary group-hover:scale-110 transition-transform" />;
                  })()}
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-black text-text-primary tracking-tight">{selectedDetailItem.name}</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-background px-3 py-1 rounded-full border border-border inline-block mx-auto">
                    {activeTab.slice(0, -1)}
                  </span>
                </div>
              </div>

              {/* Right Side - Details Content */}
              <div className="flex-1 p-8 overflow-y-auto no-scrollbar flex flex-col gap-8">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Description</p>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {selectedDetailItem.description || `Detailed information and management for the ${selectedDetailItem.name} ${activeTab.toLowerCase().slice(0, -1)}.`}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedDetailItem(null)}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-xl transition-all"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-background border border-border flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Status</span>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-bold text-text-primary">Active</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-background border border-border flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      {activeTab === 'Job Categories' ? 'Total Listings' : activeTab === 'Skills' ? 'Popularity' : 'Usage'}
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {selectedDetailItem.count !== undefined ? `${selectedDetailItem.count} Jobs` : selectedDetailItem.popularity || 'Standard'}
                    </span>
                  </div>
                </div>

                {activeTab === 'Job Categories' && (
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      <Tag className="size-3" /> Related Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.filter(s => s.category === selectedDetailItem.name).map(skill => (
                        <span key={skill.id} className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-text-primary hover:border-primary/30 transition-all cursor-default">
                          {skill.name}
                        </span>
                      ))}
                      {skills.filter(s => s.category === selectedDetailItem.name).length === 0 && (
                        <p className="text-xs text-text-secondary italic">No specific skills mapped yet.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock className="size-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Last updated 2 days ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(selectedDetailItem)}
                      className="p-2 rounded-xl border border-border hover:bg-background transition-all text-text-secondary hover:text-primary"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button 
                      onClick={() => {
                        handleDelete(selectedDetailItem.id);
                        setSelectedDetailItem(null);
                      }}
                      className="p-2 rounded-xl border border-border hover:bg-red-50 transition-all text-text-secondary hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    {editingItem ? <Edit2 className="size-5" /> : <Plus className="size-5" />}
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">{editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h2>
                </div>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                    setNewName('');
                    setNewDescription('');
                  }}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-primary">{activeTab.slice(0, -1)} Name</label>
                  <input 
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                    placeholder={`e.g. ${activeTab === 'Job Categories' ? 'Software Development' : activeTab === 'Skills' ? 'React.js' : 'Full-time'}`}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                {activeTab !== 'Skills' ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Description</label>
                    <textarea 
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner resize-none" 
                      placeholder="Explain what this covers..." 
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-primary">Associated Category</label>
                    <select 
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                    >
                      {jobCategories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'Job Categories' && (
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-bold text-text-primary">Category Icon</label>
                    <button 
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className={cn(
                        "flex items-center gap-4 w-full p-3 rounded-xl border bg-background/50 transition-all text-left group",
                        showIconPicker ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="size-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <SelectedIcon className="text-primary size-5" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-bold text-text-primary">{selectedIconName}</span>
                        <span className="text-[10px] text-text-secondary uppercase font-black tracking-widest">
                          {showIconPicker ? 'Selecting icon...' : 'Click to change icon'}
                        </span>
                      </div>
                      <div className="size-8 rounded-lg flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                        <Settings2 className={cn("size-4 transition-transform duration-300", showIconPicker && "rotate-180")} />
                      </div>
                    </button>

                    {showIconPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 grid grid-cols-5 gap-2 p-3 bg-surface border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto no-scrollbar"
                      >
                        {AVAILABLE_ICONS.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setSelectedIconName(item.name);
                              setShowIconPicker(false);
                            }}
                            className={cn(
                              "flex items-center justify-center p-2 rounded-lg border transition-all hover:bg-primary/10 group/item",
                              selectedIconName === item.name ? "border-primary bg-primary/5" : "border-border"
                            )}
                          >
                            <item.icon className={cn("size-5 group-hover/item:scale-110 transition-transform", selectedIconName === item.name ? "text-primary" : "text-text-secondary")} />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform active:scale-95"
                  >
                    {editingItem ? 'Save Changes' : `Create ${activeTab.slice(0, -1)}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

};

