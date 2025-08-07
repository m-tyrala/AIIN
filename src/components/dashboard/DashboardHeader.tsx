import React from 'react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  onCreateNew?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onCreateNew = () => {}
}) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard NPC</h1>
        <p className="text-muted-foreground mt-1">Zarządzaj profilami postaci niezależnych</p>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onCreateNew} className="w-full sm:w-auto">
          Nowy NPC
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader; 