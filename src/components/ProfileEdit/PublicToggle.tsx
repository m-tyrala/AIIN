import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { PublicToggleProps } from '@/types/profile-edit';

export const PublicToggle: React.FC<PublicToggleProps> = ({
  checked,
  onChange,
  disabled = false
}) => {
  const handleCheckedChange = (checkedValue: boolean) => {
    onChange(checkedValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="is_public"
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
          className={`
            mt-0.5 transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-describedby="public-help-text"
        />
        
        <div className="flex-1 space-y-1">
          <Label 
            htmlFor="is_public" 
            className={`
              text-sm font-medium cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Profil publiczny
          </Label>
          
          <p 
            id="public-help-text" 
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {checked 
              ? 'Profil będzie widoczny dla innych użytkowników. Możesz go później ustawić jako prywatny.'
              : 'Profil będzie widoczny tylko dla Ciebie. Możesz go później udostępnić publicznie.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}; 