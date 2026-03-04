import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, helperText, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <input
            ref={ref}
            className={`block w-full rounded-lg border-0 bg-white py-3 ${
              Icon ? 'pl-10' : 'pl-4'
            } pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#137fec] sm:text-sm sm:leading-6 transition-all ${className}`}
            {...props}
          />
        </div>
        {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
