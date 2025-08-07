import { useState } from "react";
import { Checkbox } from "./ui/checkbox";

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
  isLoading?: boolean;
}

const MultiSelect = ({
  options,
  selectedValues,
  onChange,
  label = "Wybierz opcje",
  isLoading = false,
}: MultiSelectProps) => {
  const handleToggleOption = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">Ładowanie opcji...</div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">Brak dostępnych opcji</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="border rounded-md p-4 max-h-60 overflow-y-auto hover:bg-accent/50 hover:border-accent transition-colors">
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2 hover:bg-accent/30 rounded-sm p-1 -m-1 transition-colors">
              <Checkbox
                id={`option-${option.id}`}
                checked={selectedValues.includes(option.id)}
                onCheckedChange={() => handleToggleOption(option.id)}
              />
              <label
                htmlFor={`option-${option.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect; 