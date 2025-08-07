import React, { useCallback } from 'react';
import { useProfileEdit } from '@/hooks/useProfileEdit';
import { useToastActions } from '@/contexts/ToastContext';
import { LoadingSpinner } from './LoadingSpinner';
import { ProfileEditForm } from './ProfileEditForm';

interface ProfileEditContainerProps {
  profileId: string;
}

export const ProfileEditContainer: React.FC<ProfileEditContainerProps> = ({
  profileId
}) => {
  const {
    profile,
    formData,
    isLoading,
    isSubmitting,
    errors,
    isDirty,
    isValid,
    isNewProfile,
    updateField,
    validateField,
    saveProfile,
    resetForm
  } = useProfileEdit(profileId);

  const { showSuccess, showError } = useToastActions();

  // Obsługa zapisywania formularza
  const handleSubmit = useCallback(async () => {
    try {
      const success = await saveProfile();
      
      if (success) {
        showSuccess(
          isNewProfile 
            ? 'Profil został pomyślnie utworzony!' 
            : 'Profil został pomyślnie zaktualizowany!'
        );
        
        // Przekierowanie po sukcesie (opcjonalnie)
        // Po 2 sekundach przejdź do dashboardu
        setTimeout(() => {
          window.location.href = '/'; // dashboard z listą profili
        }, 2000);
      }
    } catch (error) {
      // Błąd jest już obsłużony w hooku, ale możemy dodać dodatkowy toast
      console.error('Submit error:', error);
    }
  }, [saveProfile, isNewProfile, showSuccess]);

  // Obsługa anulowania
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę?'
      );
      
      if (!confirmLeave) {
        return;
      }
    }
    
    // Przekierowanie do dashboardu
    window.location.href = '/';
  }, [isDirty]);

  // Obsługa błędu ładowania
  if (!isLoading && errors.general && !formData.name) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="text-destructive font-medium">
              Błąd ładowania profilu
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {errors.general}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Wróć do dashboardu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stan ładowania
  if (isLoading) {
    return (
      <LoadingSpinner 
        message={
          isNewProfile 
            ? 'Przygotowywanie formularza...' 
            : 'Ładowanie profilu...'
        } 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Główny formularz */}
      <ProfileEditForm
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        isValid={isValid}
        isNewProfile={isNewProfile}
        onFieldChange={updateField}
        onFieldBlur={validateField}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}; 