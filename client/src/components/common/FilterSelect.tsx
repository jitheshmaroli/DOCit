import React, { useCallback } from 'react';

interface FilterSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const FilterSelect = React.memo(({ value, options, onChange, label, className }: FilterSelectProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className={`flex flex-col ${className || ''}`}>
      {label && <label className="text-sm text-gray-200 mb-1">{label}</label>}
      <select
        value={value}
        onChange={handleChange}
        className="w-full md:w-48 p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

export default FilterSelect;