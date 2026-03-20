import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  Settings, 
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'User Management', path: '/admin/users' },
  { icon: ShieldCheck, label: 'Team Management', path: '/admin/team' },
  { icon: Layers, label: 'Category Management', path: '/admin/categories' },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  { icon: CheckCircle2, label: 'Verification', path: '/admin/verification' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export const Sidebar = () => {
  const { settings } = useProfile();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navBase =
    "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 group";
  const navActive = "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-600";
  const navInactive = "text-slate-500 hover:bg-slate-50 hover:text-slate-700";

  return (
    <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0 fixed left-0 top-0 z-20">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-blue-600 size-6" />
          </div>
          <span className="text-xl font-black text-gray-800 tracking-tight">ADMIN PRO</span>
        </div>
      </div>

      <nav className="flex flex-1 min-h-0 flex-col gap-3 px-4 py-4 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => cn(
              navBase,
              isActive ? navActive : navInactive
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-4">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 -m-2 rounded-xl transition-all hover:shadow-sm hover:shadow-black/5 hover:scale-[1.02]"
            onClick={() => navigate('/admin/profile')}
          >
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
              {settings.avatar ? (
                <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="size-5 text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-text-primary truncate">{settings.name || 'Sophea Chan'}</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">{settings.role || 'Super Admin'}</span>
            </div>
          </div>
          <button 
            onClick={() => logout(navigate)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 hover:scale-[1.02] hover:shadow-sm hover:shadow-red-500/10"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

