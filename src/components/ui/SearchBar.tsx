import React, { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'بحث عن مباريات، فرق، أو لاعبين...',
  loading = false,
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-gray-400">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Search className="w-4.5 h-4.5" />
        )}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface hover:bg-surface-hover/80 text-white rounded-2xl pr-10 pl-10 py-3 text-xs md:text-sm font-bold border border-border/10 focus:border-primary/40 focus:bg-surface-hover focus:outline-none transition-all placeholder:text-gray-500"
        placeholder={placeholder}
        dir="rtl"
      />

      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 left-3 flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          title="مسح البحث"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
