import React from 'react';
import SearchInput from './SearchInput';
import PublicProfileFilter from './PublicProfileFilter';
import SortSelector from './SortSelector';
import type { DashboardFilters, User } from '@/types';

interface FilterSectionProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
  disabled?: boolean;
  currentUser?: User | null;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  onFiltersChange,
  disabled = false,
  currentUser
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ search });
  };

  const handlePublicFilterChange = (isPublic: boolean | undefined) => {
    onFiltersChange({ isPublic });
  };

  const handleSortChange = (sort: DashboardFilters['sort']) => {
    onFiltersChange({ sort });
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Input */}
        <SearchInput
          value={filters.search}
          onChange={handleSearchChange}
          disabled={disabled}
          placeholder="Szukaj po nazwie, zawodzie, cechach..."
        />
        
        {/* Public Profile Filter */}
        <div className="w-full lg:w-auto">
          <PublicProfileFilter
            checked={filters.isPublic}
            onChange={handlePublicFilterChange}
            disabled={disabled}
            currentUser={currentUser}
          />
        </div>
        
        {/* Sort Selector */}
        <div className="w-full lg:w-auto">
          <SortSelector
            value={filters.sort}
            onChange={handleSortChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection; 