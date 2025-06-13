import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortOption } from '@/types';
import { SortValidationSchema } from '@/lib/schemas/dashboard.schema';

interface SortSelectorProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
  disabled?: boolean;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "created_at desc", label: "Najnowsze" },
  { value: "created_at asc", label: "Najstarsze" },
  { value: "updated_at desc", label: "Ostatnio edytowane" },
  { value: "updated_at asc", label: "Dawno edytowane" },
  { value: "name asc", label: "Nazwa A-Z" },
  { value: "name desc", label: "Nazwa Z-A" },
];

const SortSelector: React.FC<SortSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handleSortChange = (newSort: string) => {
    try {
      const validatedSort = SortValidationSchema.parse(newSort);
      onChange(validatedSort);
    } catch (error) {
      console.error('Invalid sort option:', error);
      // Fallback to default
      onChange(SortValidationSchema.parse("created_at desc"));
    }
  };

  const getCurrentLabel = () => {
    const option = sortOptions.find(opt => opt.value === value);
    return option?.label || "Sortuj";
  };

  return (
    <Select value={value} onValueChange={handleSortChange} disabled={disabled}>
      <SelectTrigger className="w-full lg:w-auto min-w-[160px]">
        <SelectValue placeholder="Sortuj profile">
          {getCurrentLabel()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SortSelector; 