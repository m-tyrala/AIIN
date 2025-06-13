import React, { useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormTextAreaProps } from '@/types/profile-edit';

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  maxLength,
  placeholder,
  rows = 3,
  autoResize = true,
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, rows * 24)}px`;
    }
  }, [value, autoResize, rows]);

  const characterCount = value.length;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={`
            w-full transition-colors resize-none
            ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${autoResize ? 'overflow-hidden' : 'overflow-auto'}
          `}
          style={autoResize ? { minHeight: `${rows * 24}px` } : undefined}
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