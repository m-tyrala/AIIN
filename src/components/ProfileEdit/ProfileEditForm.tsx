import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from './FormField';
import { FormTextArea } from './FormTextArea';
import { ComplexitySelect } from './ComplexitySelect';
import { PublicToggle } from './PublicToggle';
import { FormActions } from './FormActions';
import type { 
  ProfileFormData, 
  ValidationErrors 
} from '@/types/profile-edit';

interface ProfileEditFormProps {
  formData: ProfileFormData;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  isNewProfile: boolean;
  onFieldChange: (field: keyof ProfileFormData, value: any) => void;
  onFieldBlur?: (field: keyof ProfileFormData) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  formData,
  errors,
  isSubmitting,
  isDirty,
  isValid,
  isNewProfile,
  onFieldChange,
  onFieldBlur,
  onSubmit,
  onCancel,
  disabled = false
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  const fieldDisabled = disabled || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sekcja podstawowych informacji */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Podstawowe informacje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <FormField
            label="Nazwa postaci"
            name="name"
            value={formData.name}
            onChange={(value) => onFieldChange('name', value)}
            onBlur={() => onFieldBlur?.('name')}
            error={errors.name}
            required={true}
            maxLength={100}
            placeholder="np. Mistrz Kowal Jan"
            disabled={fieldDisabled}
          />
          
          <FormField
            label="Zawód"
            name="profession"
            value={formData.profession}
            onChange={(value) => onFieldChange('profession', value)}
            onBlur={() => onFieldBlur?.('profession')}
            error={errors.profession}
            required={true}
            maxLength={100}
            placeholder="np. Kowal, Kupiec, Strażnik"
            disabled={fieldDisabled}
          />
          
          <ComplexitySelect
            value={formData.complexity_level}
            onChange={(value) => onFieldChange('complexity_level', value)}
            error={errors.complexity_level}
            disabled={fieldDisabled}
          />
        </CardContent>
      </Card>

      {/* Sekcja opisów */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Opisy postaci
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <FormTextArea
            label="Wygląd"
            name="appearance"
            value={formData.appearance}
            onChange={(value) => onFieldChange('appearance', value)}
            onBlur={() => onFieldBlur?.('appearance')}
            error={errors.appearance}
            required={true}
            maxLength={500}
            rows={3}
            placeholder="Opisz wygląd postaci, ubiór, charakterystyczne cechy..."
            disabled={fieldDisabled}
          />
          
          <FormTextArea
            label="Relacja z grupą"
            name="relationship_to_party"
            value={formData.relationship_to_party}
            onChange={(value) => onFieldChange('relationship_to_party', value)}
            onBlur={() => onFieldBlur?.('relationship_to_party')}
            error={errors.relationship_to_party}
            required={true}
            maxLength={500}
            rows={3}
            placeholder="Jak postać odnosi się do graczy? Czy jest przyjazna, wroga, neutralna?"
            disabled={fieldDisabled}
          />
          
          <FormTextArea
            label="Opis sceny"
            name="scene_description"
            value={formData.scene_description}
            onChange={(value) => onFieldChange('scene_description', value)}
            onBlur={() => onFieldBlur?.('scene_description')}
            error={errors.scene_description}
            required={false}
            maxLength={500}
            rows={3}
            placeholder="W jakiej scenie postać się pojawia? Opisz kontekst spotkania..."
            disabled={fieldDisabled}
          />
          
          <FormField
            label="Szczególne cechy"
            name="special_traits"
            value={formData.special_traits}
            onChange={(value) => onFieldChange('special_traits', value)}
            onBlur={() => onFieldBlur?.('special_traits')}
            error={errors.special_traits}
            required={true}
            maxLength={150}
            placeholder="Charakterystyczne nawyki, maniery, sposób mówienia..."
            disabled={fieldDisabled}
          />
        </CardContent>
      </Card>

      {/* Sekcja ustawień */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Ustawienia profilu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PublicToggle
            checked={formData.is_public}
            onChange={(value) => onFieldChange('is_public', value)}
            disabled={fieldDisabled}
          />
        </CardContent>
      </Card>

      {/* Błąd globalny */}
      {errors.general && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-sm text-destructive" role="alert">
              {errors.general}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Akcje formularza */}
      <FormActions
        onAccept={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        isValid={isValid}
        isNewProfile={isNewProfile}
      />
    </form>
  );
}; 