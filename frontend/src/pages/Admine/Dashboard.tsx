import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  CheckCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useProfile } from '@/context/ProfileContext';
import { cn } from '@/lib/utils';
import api from '../../api/axios';

const skillData = [
  { name: 'Marketing', value: 85 },
  { name: 'Design', value: 65 },
  { name: 'Coding', value: 75 },
  { name: 'Sales', value: 50 },
  { name: 'HR', value: 40 },
];

const growthData = [
  { name: 'Jan', value: 30 },
  { name: 'Feb', value: 45 },
  { name: 'Mar', value: 35 },
  { name: 'Apr', value: 55 },
  { name: 'May', value: 48 },
  { name: 'Jun', value: 70 },
];

export const Dashboard = () => {
  const { settings } = useProfile();
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Total Students', value: '0', trend: '0%', icon: Users, link: '/admin/users?role=student' },
    { label: 'Total Companies', value: '0', trend: '0%', icon: Building2, link: '/admin/users?role=company' },
    { label: 'Active Internships', value: '0', trend: '0%', icon: Briefcase, link: '/admin/reports' },
    { label: 'Total Users', value: '0', trend: '0%', icon: CheckCircle, link: '/admin/users' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.adminGetStats();
        setStats([
          { label: 'Total Students', value: data.students.toLocaleString(), trend: '12%', icon: Users, link: '/admin/users?role=student' },
          { label: 'Total Companies', value: data.companies.toLocaleString(), trend: '5%', icon: Building2, link: '/admin/users?role=company' },
          { label: 'Active Internships', value: data.internships.toLocaleString(), trend: '8%', icon: Briefcase, link: '/admin/reports' },
          { label: 'Total Users', value: data.totalUsers.toLocaleString(), trend: '15%', icon: CheckCircle, link: '/admin/users' },
        ]);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setIsPendingLoading(true);
        setPendingError('');
        const data = await api.adminGetCompanyVerifications();
        const pending = Array.isArray(data)
          ? data.filter((item) => item.status === 'pending')
          : [];
        setPendingCompanies(pending);
      } catch (error) {
        console.error('Failed to fetch pending verifications:', error);
        setPendingError('Failed to load pending verifications.');
      } finally {
        setIsPendingLoading(false);
      }
    };
    fetchPending();
  }, []);

  const colorMap: Record<string, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#f59e0b',
  };

  const accentHex = colorMap[settings.accentColor] || colorMap.emerald;

  const handlePendingAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.adminUpdateCompanyVerification(id, { status });
      setPendingCompanies(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to update verification:', error);
      setPendingError('Failed to update verification.');
    }
  };

  const pendingCompaniesDisplay = pendingCompanies.map((company) => {
    const name = company.company_name || company.user_name || 'Company';
    return {
      id: company.id,
      name,
      date: company.submitted_at
        ? new Date(company.submitted_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        : 'Unknown date',
      initial: name.charAt(0).toUpperCase(),
      color: 'bg-slate-200'
    };
  });

  return (
    <div className="flex flex-col gap-6 p-8 overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Platform Overview</h1>
        <p className="text-text-secondary text-base">Analytics and metrics for the Cambodian internship market.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => stat.link && navigate(stat.link)}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex justify-between items-start">
              <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
              <stat.icon className="text-primary size-6" />
            </div>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-text-primary">{isLoading ? '...' : stat.value}</p>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded mb-1">
                <TrendingUp className="size-3 mr-0.5" /> {stat.trend}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-text-primary text-lg font-bold">Most Popular Skills</h3>
              <p className="text-text-secondary text-sm">Top demanded skills over last 6 months</p>
            </div>
            <div className="px-2 py-1 bg-background rounded text-xs font-medium text-text-secondary">Real-time</div>
          </div>
          <div className="h-[220px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData}>
                <Bar dataKey="value" fill={accentHex} radius={[4, 4, 0, 0]} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-text-primary text-lg font-bold">Monthly Internship Growth</h3>
              <p className="text-text-secondary text-sm">+22% Growth this year</p>
            </div>
            <div className="px-2 py-1 bg-background rounded text-xs font-medium text-text-secondary">Yearly</div>
          </div>
          <div className="h-[220px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentHex} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={accentHex} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={accentHex} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-text-primary text-lg font-bold">Pending Company Verifications</h3>
            <button
              onClick={() => navigate('/admin/verification')}
              className="text-sm font-medium text-primary hover:opacity-80 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="flex flex-col p-2">
            {isPendingLoading ? (
              <div className="p-4 text-sm text-text-secondary">Loading pending verifications...</div>
            ) : pendingError ? (
              <div className="p-4 text-sm text-rose-600">{pendingError}</div>
            ) : pendingCompaniesDisplay.length === 0 ? (
              <div className="p-4 text-sm text-text-secondary">No pending company verifications.</div>
            ) : (
              pendingCompaniesDisplay.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 hover:bg-background rounded-lg transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn("size-10 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg", company.color)}>
                      {company.initial}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-text-primary">{company.name}</p>
                      <p className="text-xs text-text-secondary">Applied on {company.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePendingAction(company.id, 'rejected')}
                      className="size-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <span className="text-xs font-bold">x</span>
                    </button>
                    <button
                      onClick={() => handlePendingAction(company.id, 'approved')}
                      className="size-8 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                      <span className="text-xs font-bold">v</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface shadow-sm h-full">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-text-primary text-lg font-bold">Recent Activity</h3>
          </div>
          <div className="flex flex-col p-4 gap-6">
            {[
              { title: 'New Student Registration', desc: 'Dara Sok joined the platform', time: '2 mins ago', color: 'bg-primary' },
              { title: 'Internship Posted', desc: 'Smart Axiata posted "Jr. Dev"', time: '15 mins ago', color: 'bg-blue-500' },
              { title: 'Verification Approved', desc: 'Chip Mong Group verified', time: '1 hour ago', color: 'bg-emerald-500' },
            ].map((activity, idx, arr) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn("size-2 rounded-full mt-2", activity.color)}></div>
                  {idx !== arr.length - 1 && <div className="w-px h-full bg-border"></div>}
                </div>
                <div className="flex flex-col pb-2">
                  <p className="text-sm text-text-primary font-medium">{activity.title}</p>
                  <p className="text-xs text-text-secondary">{activity.desc}</p>
                  <span className="text-[10px] text-text-secondary mt-1 uppercase">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
