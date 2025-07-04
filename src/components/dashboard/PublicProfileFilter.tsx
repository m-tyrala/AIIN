import React from 'react';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onChange(true);
    } else {
      onChange(undefined); // undefined = wszystkie profile
    }
  };

  const getLabel = () => {
    return checked === true ? 'Tylko publiczne profile' : 'Wszystkie profile';
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="public-filter"
        checked={checked === true}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-describedby="public-filter-description"
      />
      <label 
        htmlFor="public-filter" 
        className={`text-sm font-medium leading-none ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
      >
        {getLabel()}
      </label>
      <span 
        id="public-filter-description" 
        className="sr-only"
      >
        Filtruj profile według widoczności publicznej
      </span>
    </div>
  );
};

export default PublicProfileFilter; 