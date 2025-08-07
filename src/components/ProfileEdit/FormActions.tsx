import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import type { ActionButtonsProps } from '@/types/profile-edit';

export const FormActions: React.FC<ActionButtonsProps> = ({
  onAccept,
  onCancel,
  isSubmitting,
  isDirty,
  isValid,
  isNewProfile
}) => {
  return (
    <div className="flex flex-col gap-4 pt-6 border-t border-border">
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:ml-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[120px] order-2 sm:order-1"
        >
          <X className="w-4 h-4 mr-2" />
          Anuluj
        </Button>
        
        <Button
          type="submit"
          onClick={onAccept}
          disabled={isSubmitting || !isValid || (!isNewProfile && !isDirty)}
          className="w-full sm:w-auto min-w-[120px] order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Zapisz
            </>
          )}
        </Button>
      </div>
      
      {/* Status formularza */}
      <div className="text-xs text-muted-foreground text-center sm:text-left sm:mr-auto">
        {!isValid && (
          <span className="text-destructive">
            Wypełnij wszystkie wymagane pola
          </span>
        )}
        {isValid && !isDirty && !isSubmitting && !isNewProfile && (
          <span>
            Brak zmian do zapisania
          </span>
        )}
        {isValid && !isDirty && !isSubmitting && isNewProfile && (
          <span className="text-blue-600">
            Gotowy do zapisania
          </span>
        )}
        {isValid && isDirty && !isSubmitting && (
          <span className="text-orange-600">
            Masz niezapisane zmiany
          </span>
        )}
      </div>
    </div>
  );
}; 