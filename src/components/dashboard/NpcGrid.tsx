import React from 'react';
import NpcCard from './NpcCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import type { NpcProfileDTO } from '@/types';

interface NpcGridProps {
  profiles: NpcProfileDTO[];
  currentUserId: string;
  loading?: boolean;
  error?: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry?: () => void;
}

const NpcGrid: React.FC<NpcGridProps> = ({
  profiles,
  currentUserId,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onRetry
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="lg" text="Ładowanie profili NPC..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        title="Błąd podczas ładowania profili"
        message={error}
        onRetry={onRetry}
        className="py-8"
      />
    );
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="text-muted-foreground">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">
            Brak profili NPC
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Nie znaleziono żadnych profili pasujących do wybranych kryteriów. 
            Spróbuj zmienić filtry lub utwórz nowy profil.
          </p>
        </div>
      </div>
    );
  }

  // Grid with profiles
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {profiles.map((profile) => {
        const isOwner = profile.user_id === currentUserId;
        
        return (
          <NpcCard
            key={profile.id}
            profile={profile}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
};

export default NpcGrid; 