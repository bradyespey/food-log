import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  tabIndex?: number;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  onKeyDown,
  tabIndex,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when dropdown opens
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredOptions.length > 0 && !isOpen) {
      setIsOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      return;
    }
    if (e.key === 'ArrowDown' && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      // Focus first option
      const firstOption = containerRef.current?.querySelector('[data-option]') as HTMLElement;
      firstOption?.focus();
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDownInternal}
        tabIndex={tabIndex}
        className="w-full flex items-center justify-between px-2.5 py-1.5 h-8 text-xs border border-border rounded-lg bg-card text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setSearchTerm('');
                } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                  handleSelect(filteredOptions[0]);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const firstOption = containerRef.current?.querySelector('[data-option]') as HTMLElement;
                  firstOption?.focus();
                }
              }}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  data-option
                  onClick={() => handleSelect(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSelect(option);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                      next?.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement;
                      prev?.focus();
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary focus:outline-none focus:bg-secondary flex items-center justify-between ${
                    value === option ? 'bg-secondary text-foreground' : ''
                  }`}
                >
                  <span>{option}</span>
                  {value === option && <Check className="w-3 h-3 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
