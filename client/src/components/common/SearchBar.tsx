import React, { useCallback, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = React.memo(
  ({
    value,
    onChange,
    placeholder = 'Search...',
    className,
  }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${className || ''}`}
      />
    );
  }
);

export default SearchBar;
