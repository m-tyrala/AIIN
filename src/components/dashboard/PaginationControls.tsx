import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginationState } from '@/types';

interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  disabled?: boolean;
}

const limitOptions = [
  { value: 6, label: '6 na stronę' },
  { value: 12, label: '12 na stronę' },
  { value: 24, label: '24 na stronę' },
  { value: 48, label: '48 na stronę' },
];

const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  disabled = false
}) => {
  const handlePrevious = () => {
    if (pagination.hasPrev && !disabled) {
      onPageChange(pagination.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNext && !disabled) {
      onPageChange(pagination.currentPage + 1);
    }
  };

  const handleLimitChange = (newLimit: string) => {
    const limit = parseInt(newLimit);
    if (!isNaN(limit) && limit > 0 && limit <= 100) {
      onLimitChange(limit);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'ArrowLeft' && pagination.hasPrev) {
      handlePrevious();
    } else if (e.key === 'ArrowRight' && pagination.hasNext) {
      handleNext();
    }
  };

  const getResultsText = () => {
    const start = (pagination.currentPage - 1) * pagination.limit + 1;
    const end = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);
    
    if (pagination.totalCount === 0) {
      return "Brak wyników";
    }
    
    return `Wyniki ${start}-${end} z ${pagination.totalCount}`;
  };

  return (
    <div 
      className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        {getResultsText()}
      </div>
      
      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrevious}
          disabled={!pagination.hasPrev || disabled}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Poprzednia
        </Button>
        
        <div className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded">
          Strona {pagination.currentPage} z {pagination.totalPages}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNext}
          disabled={!pagination.hasNext || disabled}
          aria-label="Następna strona"
        >
          Następna
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Limit selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Pokaż:
        </span>
        <Select 
          value={pagination.limit.toString()} 
          onValueChange={handleLimitChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value.toString()}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PaginationControls; 