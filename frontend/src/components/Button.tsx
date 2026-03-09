import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', icon: Icon, iconPosition = 'right', className = '', ...props }, ref) => {
    const baseClasses = "flex justify-center items-center rounded-lg px-4 py-3 text-sm font-bold shadow-sm transition-all gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
    
    const variants = {
      primary: "bg-[#137fec] text-white hover:bg-[#137fec]/90 focus-visible:outline-[#137fec]",
      secondary: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
      outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50",
      ghost: "bg-transparent text-slate-700 hover:bg-slate-100 shadow-none",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        {...props}
      >
        {Icon && iconPosition === 'left' && <Icon className="h-5 w-5" />}
        <span>{children}</span>
        {Icon && iconPosition === 'right' && <Icon className="h-5 w-5" />}
      </button>
    );
  }
);
Button.displayName = 'Button';
