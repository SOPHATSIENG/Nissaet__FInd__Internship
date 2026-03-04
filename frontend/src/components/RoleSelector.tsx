import React from 'react';
import { GraduationCap, Building2, Shield } from 'lucide-react';

export type Role = 'student' | 'company' | 'admin';

interface RoleSelectorProps {
  selectedRole: Role;
  onChange: (role: Role) => void;
}

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
  const roles: { id: Role; label: string; icon: React.ElementType }[] = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">I am a...</label>
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/50 rounded-xl">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          const Icon = role.icon;
          return (
            <label
              key={role.id}
              className="cursor-pointer group relative flex items-center justify-center rounded-lg py-2.5 px-3 text-sm font-medium transition-all focus:outline-none"
            >
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={isSelected}
                onChange={() => onChange(role.id)}
                className="peer sr-only"
              />
              <span className={`absolute inset-0 rounded-lg bg-white shadow-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}></span>
              <span className={`relative z-10 flex items-center gap-2 ${isSelected ? 'text-[#137fec]' : 'text-slate-500'}`}>
                <Icon className="h-4 w-4" />
                <span className="truncate">{role.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
