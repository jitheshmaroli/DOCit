import React, {
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
} from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceDelay?: number;
}

// Generic debounce function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const SearchBar = React.memo(
  ({
    value,
    onChange,
    placeholder = 'Search...',
    className,
    debounceDelay = 600,
  }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const debouncedOnChange = useMemo(
      () =>
        debounce((searchValue: string) => onChange(searchValue), debounceDelay),
      [onChange, debounceDelay]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedOnChange(newValue);
      },
      [debouncedOnChange]
    );

    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full md:w-1/3 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${className || ''}`}
      />
    );
  }
);

export default SearchBar;
