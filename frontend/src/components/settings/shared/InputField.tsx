import {type HTMLInputTypeAttribute, type ReactNode} from 'react';
import {type LucideIcon} from 'lucide-react';

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  defaultValue?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
}

export function InputField({
  label,
  placeholder,
  type = 'text',
  defaultValue,
  icon: Icon,
  rightElement,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
            Icon ? 'pl-10' : ''
          }`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}
