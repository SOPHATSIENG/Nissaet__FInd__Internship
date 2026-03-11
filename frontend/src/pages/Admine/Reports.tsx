import React, { useState } from 'react';
import { 
  FileDown, 
  Calendar, 
  Filter, 
  BarChart3, 
  TrendingUp,
  Download,
  ChevronDown,
  Activity,
  Users,
  Briefcase,
  Check,
  MousePointer2,
  PieChart as PieChartIcon,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Share2,
  MoreVertical
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '@/context/ProfileContext';

const placementData = [
  { name: 'IT & Software', value: 450 },
  { name: 'Marketing', value: 320 },
  { name: 'Design', value: 280 },
  { name: 'Finance', value: 150 },
];

const growthData = [
  { name: 'Week 1', students: 120, companies: 40, placements: 25 },
  { name: 'Week 2', students: 180, companies: 55, placements: 42 },
  { name: 'Week 3', students: 150, companies: 48, placements: 38 },
  { name: 'Week 4', students: 210, companies: 62, placements: 55 },
  { name: 'Week 5', students: 250, companies: 75, placements: 68 },
  { name: 'Week 6', students: 230, companies: 70, placements: 60 },
  { name: 'Week 7', students: 280, companies: 85, placements: 75 },
];

const DATE_RANGES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Custom Range', value: 'custom' },
];

const CHART_TYPES = [
  { icon: BarChart3, value: 'bar', label: 'Bar' },
  { icon: Activity, value: 'area', label: 'Area' },
  { icon: TrendingUp, value: 'line', label: 'Line' },
];

export const Reports = () => {
  const { settings } = useProfile();
  const [dateRange, setDateRange] = useState('30d');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [chartType, setChartType] = useState('area');
  const [activeMetric, setActiveMetric] = useState('students');

  const colorMap: Record<string, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#f59e0b',
  };
  
  const accentHex = colorMap[settings.accentColor] || colorMap.emerald;
  const COLORS = [accentHex, '#3b82f6', '#8b5cf6', '#f59e0b'];

  const stats = [
    { label: 'New Students', value: '1,240', metric: 'students', icon: Users, trend: '+12.5%', isUp: true },
    { label: 'New Companies', value: '145', metric: 'companies', icon: Briefcase, trend: '+5.2%', isUp: true },
    { label: 'Placements', value: '382', metric: 'placements', icon: Check, trend: '-2.1%', isUp: false },
  ];

  const renderChart = () => {
    const commonProps = {
      data: growthData,
      margin: { top: 10, right: 10, left: -20, bottom: 0 },
    };

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
            cursor={{ fill: 'var(--background)' }}
          />
          <Bar dataKey={activeMetric} fill={accentHex} radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
          <Line type="monotone" dataKey={activeMetric} stroke={accentHex} strokeWidth={3} dot={{ r: 4, fill: accentHex, strokeWidth: 2, stroke: 'var(--surface)' }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accentHex} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={accentHex} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
        <Area type="monotone" dataKey={activeMetric} stroke={accentHex} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
      </AreaChart>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 overflow-y-auto no-scrollbar max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-text-primary tracking-tight">Platform Reports</h1>
          <p className="text-text-secondary text-lg">Comprehensive data and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-sm">
            <button className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-background">
              <Printer className="size-5" />
            </button>
            <button className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-background">
              <Share2 className="size-5" />
            </button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <button className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-md">
              <Download className="size-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <button 
              onClick={() => setIsDateOpen(!isDateOpen)}
              className="flex items-center gap-2 h-11 px-4 rounded-xl border border-border bg-background text-sm font-bold text-text-primary hover:border-primary transition-all"
            >
              <Calendar className="size-4 text-primary" />
              {DATE_RANGES.find(r => r.value === dateRange)?.label}
              <ChevronDown className={cn("size-4 transition-transform", isDateOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {isDateOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDateOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-20 p-2 flex flex-col gap-1"
                  >
                    {DATE_RANGES.map(range => (
                      <button 
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value);
                          setIsDateOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors",
                          dateRange === range.value ? "bg-primary/10 text-primary font-bold" : "text-text-secondary hover:bg-background"
                        )}
                      >
                        {range.label}
                        {dateRange === range.value && <Check className="size-4" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary size-4" />
            <input 
              type="text" 
              placeholder="Search metrics..." 
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-text-primary focus:border-primary focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
          {CHART_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setChartType(type.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                chartType === type.value 
                  ? "bg-surface text-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <type.icon className="size-4" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <button 
            key={stat.label}
            onClick={() => setActiveMetric(stat.metric)}
            className={cn(
              "flex flex-col gap-4 p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
              activeMetric === stat.metric 
                ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" 
                : "border-border bg-surface shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex justify-between items-start relative z-10">
              <div className={cn(
                "size-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                activeMetric === stat.metric ? "bg-primary text-white" : "bg-background text-primary border border-border"
              )}>
                <stat.icon className="size-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                stat.isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              )}>
                {stat.isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-4xl font-black text-text-primary tracking-tight">{stat.value}</h3>
            </div>
            {activeMetric === stat.metric && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="flex flex-col gap-6 p-8 rounded-[2rem] border border-border bg-surface shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-black text-text-primary tracking-tight">Performance Analytics</h3>
            <p className="text-sm text-text-secondary">Visualizing <span className="text-primary font-bold capitalize">{activeMetric}</span> trends for the current period.</p>
          </div>
          <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-primary"></div>
              <span className="text-xs font-bold text-text-primary capitalize">{activeMetric}</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <span className="text-xs font-black text-primary">LIVE</span>
          </div>
        </div>
        <div className="h-[450px] w-full mt-6 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Industry Distribution */}
        <div className="flex flex-col gap-8 p-8 rounded-[2rem] border border-border bg-surface shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-text-primary tracking-tight">Industry Distribution</h3>
              <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">Market Share by Sector</p>
            </div>
            <button className="p-2 rounded-xl hover:bg-background transition-colors">
              <MoreVertical className="size-5 text-text-secondary" />
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="h-64 w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={placementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    {placementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', padding: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col gap-3 w-full lg:w-1/2">
              {placementData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-sm text-text-primary font-bold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary font-black">{item.value}</span>
                    <span className="text-[10px] text-text-secondary font-bold">({Math.round(item.value / 1200 * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="flex flex-col gap-8 p-8 rounded-[2rem] border border-border bg-surface shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-text-primary tracking-tight">Conversion Funnel</h3>
              <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">User Journey Efficiency</p>
            </div>
            <MousePointer2 className="size-5 text-primary" />
          </div>
          
          <div className="flex flex-col gap-6">
            {[
              { label: 'Profile Views', value: '45,200', percentage: 100, color: 'bg-primary' },
              { label: 'Applications', value: '12,400', percentage: 27, color: 'bg-blue-500' },
              { label: 'Interviews', value: '3,200', percentage: 7, color: 'bg-indigo-500' },
              { label: 'Placements', value: '1,540', percentage: 3, color: 'bg-violet-500' },
            ].map((step, idx) => (
              <div key={step.label} className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-text-secondary opacity-30">0{idx + 1}</span>
                    <span className="text-sm font-bold text-text-primary">{step.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-text-primary tracking-tight">{step.value}</span>
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{step.percentage}%</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-border p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${step.percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut", delay: idx * 0.1 }}
                    className={cn("h-full rounded-full shadow-sm", step.color)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-2 p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-text-primary">Conversion Insight</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your application-to-interview conversion rate has increased by <span className="font-black text-primary">2.4%</span> since last month. Consider optimizing the "Interview" stage for higher placement yields.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
