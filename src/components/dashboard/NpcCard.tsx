import React, { useState } from 'react';
import { Edit, Trash2, Globe, Lock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NpcCardProps } from '@/types';

const NpcCard: React.FC<NpcCardProps> = ({
  profile,
  currentUserId,
  isOwner,
  onEdit,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (isOwner) {
      onEdit(profile.id);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) return;
    
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć profil "${profile.name}"? Ta operacja jest nieodwracalna.`
    );
    
    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(profile.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'complex': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getComplexityLabel = (level: string) => {
    switch (level) {
      case 'simple': return 'Prosty';
      case 'medium': return 'Średni';
      case 'complex': return 'Złożony';
      default: return level;
    }
  };

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {profile.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {profile.profession}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {profile.is_public ? (
              <div title="Profil publiczny">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <div title="Profil prywatny">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {profile.appearance}
          </p>
        </div>
        
        {profile.special_traits && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Cechy specjalne:</p>
            <p className="text-sm line-clamp-1">
              {profile.special_traits}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Utworzono: {formatDate(profile.created_at)}
          </span>
          <span className={`font-medium ${getComplexityColor(profile.complexity_level)}`}>
            {getComplexityLabel(profile.complexity_level)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          {isOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edytuj
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 text-destructive border-destructive hover:bg-destructive/50 hover:text-destructive dark:hover:bg-destructive/50 dark:hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default NpcCard; 