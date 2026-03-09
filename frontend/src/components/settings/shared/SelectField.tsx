import {type ChangeEventHandler} from 'react';
import {ChevronDown} from 'lucide-react';

type SelectOption = string | {value: string; label: string};

interface SelectFieldProps {
  label?: string;
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  value,
  onChange,
  disabled,
}: SelectFieldProps) {
  const hasControlledValue = value !== undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-600">{label}</label>}
      <div className="relative">
        <select
          name={name}
          {...(hasControlledValue ? {value} : {defaultValue})}
          onChange={onChange}
          disabled={disabled}
          className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          {options.map((option) => (
            <option
              key={typeof option === 'string' ? option : option.value}
              value={typeof option === 'string' ? option : option.value}
            >
              {typeof option === 'string' ? option : option.label}
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
