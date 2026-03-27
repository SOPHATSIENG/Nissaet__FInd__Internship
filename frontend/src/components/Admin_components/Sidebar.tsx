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
  User,
  ChevronLeft,
  ChevronRight
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

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar = ({ collapsed = false, onToggle }: SidebarProps) => {
  const { settings } = useProfile();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navBase =
    "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 group border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";
  const navActive =
    "bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(236,254,255,0.95))] text-blue-700 border-blue-200 shadow-[0_12px_30px_-22px_rgba(37,99,235,0.65)]";
  const navInactive =
    "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200";

  return (
    <aside
      className={cn(
        "bg-white border-r border-slate-200/70 flex flex-col h-full shrink-0 fixed left-0 top-0 z-20 transition-[width] duration-200",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className={cn("relative px-6 pt-7 pb-6 border-b border-slate-200/70", collapsed && "px-4")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="size-10 rounded-xl bg-[linear-gradient(135deg,#0f3b68,#0b6fa4_55%,#69b6dc)] flex items-center justify-center shadow-sm shadow-blue-900/20">
            <ShieldCheck className="text-white size-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Admin</span>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">Control Center</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
            className={cn(
              "hidden lg:flex absolute top-7 right-5 size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50/60 transition",
              collapsed && "right-4"
            )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <nav className={cn("flex flex-1 min-h-0 flex-col gap-2 px-4 py-5 overflow-y-auto no-scrollbar", collapsed && "px-3")}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              navBase,
              isActive ? navActive : navInactive,
              collapsed && "justify-center px-3"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("size-5", isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-900")} />
                <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn("p-4 border-t border-slate-200/70", collapsed && "p-3")}>
        <div className={cn("bg-slate-50/70 rounded-2xl p-4 flex flex-col gap-4", collapsed && "p-3 items-center")}>
          <div
            className={cn(
              "flex items-center gap-3 cursor-pointer hover:bg-white p-2 -m-2 rounded-xl transition-all hover:shadow-sm hover:shadow-black/5",
              collapsed && "justify-center"
            )}
            onClick={() => navigate('/admin/profile')}
            title={collapsed ? "Admin profile" : undefined}
          >
            <div className="size-10 rounded-full bg-slate-900/5 flex items-center justify-center border border-slate-200 overflow-hidden">
              {settings.avatar ? (
                <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="size-5 text-slate-700" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">{settings.name || 'Sophea Chan'}</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">{settings.role || 'Super Admin'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => logout(navigate)}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100",
              collapsed && "w-10 h-10 p-0"
            )}
          >
            <LogOut className="size-4" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </div>
    </aside>
  );
};

