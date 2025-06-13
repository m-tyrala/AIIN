import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ComplexitySelectProps } from '@/types/profile-edit';
import type { ComplexityLevel } from '@/types';

const complexityOptions: { value: ComplexityLevel; label: string; description: string }[] = [
  { 
    value: 'uproszczony', 
    label: 'Uproszczony', 
    description: 'Podstawowe informacje o postaci' 
  },
  { 
    value: 'zwykły', 
    label: 'Zwykły', 
    description: 'Standardowy poziom szczegółowości' 
  },
  { 
    value: 'szczegółowy', 
    label: 'Szczegółowy', 
    description: 'Rozbudowany profil z wieloma detalami' 
  }
];

export const ComplexitySelect: React.FC<ComplexitySelectProps> = ({
  value,
  onChange,
  error,
  disabled = false
}) => {
  const handleValueChange = (newValue: string) => {
    onChange(newValue as ComplexityLevel);
  };

  const selectedOption = complexityOptions.find(option => option.value === value);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Poziom skomplikowania
        <span className="text-destructive ml-1">*</span>
      </Label>
      
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={`
            w-full transition-colors
            ${error ? 'border-destructive focus:ring-destructive' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? 'complexity-error' : undefined}
        >
          <SelectValue placeholder="Wybierz poziom skomplikowania">
            {selectedOption && (
              <div className="flex flex-col text-left">
                <span className="font-medium">{selectedOption.label}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedOption.description}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {complexityOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p id="complexity-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}; 