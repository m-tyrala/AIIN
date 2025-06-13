import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { FormFieldProps } from '@/types/profile-edit';

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  maxLength,
  placeholder,
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const characterCount = value.length;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            w-full transition-colors
            ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1">
          {error && (
            <p id={`${name}-error`} className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        
        {maxLength && (
          <div className="text-xs text-muted-foreground ml-2">
            <span className={isOverLimit ? 'text-destructive' : ''}>
              {characterCount}
            </span>
            /{maxLength}
          </div>
        )}
      </div>
    </div>
  );
}; 