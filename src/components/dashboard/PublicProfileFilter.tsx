import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/types';

interface PublicProfileFilterProps {
  checked: boolean | undefined;
  onChange: (checked: boolean | undefined) => void;
  disabled?: boolean;
  currentUser?: User | null;
}

const PublicProfileFilter: React.FC<PublicProfileFilterProps> = ({
  checked,
  onChange,
  disabled = false,
  currentUser
}) => {
  const isUserLoggedIn = Boolean(currentUser);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // When checked, show only private profiles (for logged in users)
      onChange(false);
    } else {
      // When unchecked, show all available profiles
      onChange(undefined);
    }
  };

  const getLabel = () => {
    if (!isUserLoggedIn) {
      return 'Publiczne profile'; // For anonymous users, always shows public
    }
    
    if (checked === false) {
      return 'Tylko moje prywatne profile';
    } else {
      return 'Wszystkie dostępne profile';
    }
  };

  const isCheckboxDisabled = disabled || !isUserLoggedIn;
  
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="public-filter"
        checked={checked === false} // checked when showing only private profiles
        onCheckedChange={(isChecked) => {
          if (isChecked) {
            // When checked, show only private profiles (for logged in users)
            onChange(false);
          } else {
            // When unchecked, show all available profiles
            onChange(undefined);
          }
        }}
        disabled={isCheckboxDisabled}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-describedby="public-filter-description"
      />
      <label 
        htmlFor="public-filter" 
        className={`text-sm font-medium leading-none ${
          isCheckboxDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
      >
        {getLabel()}
      </label>
      <span 
        id="public-filter-description" 
        className="sr-only"
      >
        {isUserLoggedIn 
          ? 'Filtruj między wszystkimi dostępnymi profilami a tylko prywatnymi'
          : 'Wyświetlane są tylko publiczne profile dla niezalogowanych użytkowników'
        }
      </span>
    </div>
  );
};

export default PublicProfileFilter; 