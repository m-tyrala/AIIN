import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PublicProfileFilterProps {
  checked: boolean | undefined;
  onChange: (checked: boolean | undefined) => void;
  disabled?: boolean;
}

const PublicProfileFilter: React.FC<PublicProfileFilterProps> = ({
  checked,
  onChange,
  disabled = false
}) => {
  const handleCheckedChange = (checkedValue: boolean | 'indeterminate') => {
    if (checkedValue === 'indeterminate') {
      onChange(undefined);
    } else {
      onChange(checkedValue);
    }
  };

  const getCheckboxState = () => {
    if (checked === undefined) return 'indeterminate';
    return checked;
  };

  const getLabel = () => {
    if (checked === undefined) return 'Wszystkie profile';
    if (checked === true) return 'Tylko publiczne';
    return 'Tylko prywatne';
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="public-filter"
        checked={getCheckboxState()}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        aria-describedby="public-filter-description"
      />
      <Label 
        htmlFor="public-filter" 
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
      >
        {getLabel()}
      </Label>
      <span 
        id="public-filter-description" 
        className="text-xs text-muted-foreground hidden"
      >
        Filtruj profile według widoczności publicznej
      </span>
    </div>
  );
};

export default PublicProfileFilter; 