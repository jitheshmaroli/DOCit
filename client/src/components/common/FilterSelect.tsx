import React, { useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const FilterSelect = React.memo(
  ({ value, options, onChange, label, className }: FilterSelectProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
      [onChange]
    );

    return (
      <div className={`flex flex-col ${className || ''}`}>
        {label && <label className="label">{label}</label>}
        <div className="relative">
          <select
            value={value}
            onChange={handleChange}
            className="input appearance-none pr-9 cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
      </div>
    );
  }
);

FilterSelect.displayName = 'FilterSelect';
export default FilterSelect;
