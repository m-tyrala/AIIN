import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchInputSchema } from '@/lib/schemas/dashboard.schema';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Szukaj profili NPC...",
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const debouncedValue = useDebounce(localValue, 500);

  // Update parent when debounced value changes
  useEffect(() => {
    try {
      const validatedValue = SearchInputSchema.parse(debouncedValue);
      onChange(validatedValue);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, [debouncedValue, onChange]);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 pr-10 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          maxLength={200}
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            aria-label="Wyczyść wyszukiwanie"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchInput; 