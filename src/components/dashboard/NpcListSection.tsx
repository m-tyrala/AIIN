import React from 'react';
import NpcGrid from './NpcGrid';
import type { NpcProfileDTO } from '@/types';

interface NpcListSectionProps {
  profiles: NpcProfileDTO[];
  currentUserId: string;
  loading?: boolean;
  error?: string | null;
  totalCount?: number;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry?: () => void;
}

const NpcListSection: React.FC<NpcListSectionProps> = ({
  profiles,
  currentUserId,
  loading = false,
  error = null,
  totalCount = 0,
  onView,
  onEdit,
  onDelete,
  onRetry
}) => {
  const getHeaderText = () => {
    if (loading) return "Ładowanie profili...";
    if (error) return "Błąd ładowania";
    if (totalCount === 0) return "Brak profili";
    if (totalCount === 1) return "1 profil";
    if (totalCount < 5) return `${totalCount} profile`;
    return `${totalCount} profili`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile NPC</h2>
        <span className={`text-sm font-medium ${
          error ? 'text-destructive' : 
          loading ? 'text-muted-foreground' : 
          'text-foreground'
        }`}>
          {getHeaderText()}
        </span>
      </div>
      
      <NpcGrid
        profiles={profiles}
        currentUserId={currentUserId}
        loading={loading}
        error={error}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onRetry={onRetry}
      />
    </div>
  );
};

export default NpcListSection; 