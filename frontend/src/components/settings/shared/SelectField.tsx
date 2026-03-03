import {ChevronDown} from 'lucide-react';

interface SelectFieldProps {
  label?: string;
  options: string[];
  defaultValue?: string;
}

export function SelectField({label, options, defaultValue}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
      <div className="relative">
        <select
          defaultValue={defaultValue}
          className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
}
