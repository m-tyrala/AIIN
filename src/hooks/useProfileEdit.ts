import { useState, useEffect, useCallback } from 'react';
import type { 
  ProfileEditViewModel, 
  ProfileFormData, 
  ValidationErrors,
  ValidationRule 
} from '@/types/profile-edit';
import type { 
  NpcProfileDTO, 
  CreateNpcProfileCommand, 
  UpdateNpcProfileCommand,
  ComplexityLevel 
} from '@/types';

// Reguły walidacji dla pól formularza
const validationRules: Record<keyof ProfileFormData, ValidationRule> = {
  name: { required: true, maxLength: 100, minLength: 1 },
  appearance: { required: true, maxLength: 500, minLength: 1 },
  profession: { required: true, maxLength: 100, minLength: 1 },
  relationship_to_party: { required: true, maxLength: 500, minLength: 1 },
  scene_description: { required: true, maxLength: 500, minLength: 1 },
  special_traits: { required: true, maxLength: 150, minLength: 1 },
  complexity_level: { required: true },
  is_public: { required: false }
};

// Domyślne wartości formularza
const getDefaultFormData = (): ProfileFormData => ({
  name: '',
  appearance: '',
  profession: '',
  relationship_to_party: '',
  scene_description: '',
  special_traits: '',
  complexity_level: 'zwykły' as ComplexityLevel,
  is_public: false
});

// Funkcja walidacji pojedynczego pola
const validateField = (
  field: keyof ProfileFormData, 
  value: any, 
  rules: ValidationRule
): string | null => {
  const stringValue = String(value).trim();
  
  if (rules.required && (!stringValue || stringValue.length === 0)) {
    return 'To pole jest wymagane';
  }
  
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Minimalna długość: ${rules.minLength} znaków`;
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Maksymalna długość: ${rules.maxLength} znaków`;
  }
  
  if (rules.custom) {
    return rules.custom(stringValue);
  }
  
  return null;
};

// Funkcja walidacji całego formularza
const validateForm = (formData: ProfileFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  Object.entries(validationRules).forEach(([field, rules]) => {
    const fieldName = field as keyof ProfileFormData;
    const error = validateField(fieldName, formData[fieldName], rules);
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return errors;
};

// Konwersja NpcProfileDTO do ProfileFormData
const profileToFormData = (profile: NpcProfileDTO): ProfileFormData => ({
  name: profile.name,
  appearance: profile.appearance,
  profession: profile.profession,
  relationship_to_party: profile.relationship_to_party,
  scene_description: profile.scene_description,
  special_traits: profile.special_traits,
  complexity_level: profile.complexity_level,
  is_public: profile.is_public
});

// Konwersja ProfileFormData do Command
const formDataToCommand = (formData: ProfileFormData): CreateNpcProfileCommand => ({
  name: formData.name.trim(),
  appearance: formData.appearance.trim(),
  profession: formData.profession.trim(),
  relationship_to_party: formData.relationship_to_party.trim(),
  scene_description: formData.scene_description.trim(),
  special_traits: formData.special_traits.trim(),
  complexity_level: formData.complexity_level,
  is_public: formData.is_public
});

export const useProfileEdit = (profileId: string | 'new') => {
  const [viewModel, setViewModel] = useState<ProfileEditViewModel>({
    profile: null,
    isLoading: true,
    isSubmitting: false,
    errors: {},
    isDirty: false,
    isNewProfile: profileId === 'new',
    isValid: false
  });

  const [formData, setFormData] = useState<ProfileFormData>(getDefaultFormData());
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>(getDefaultFormData());

  // Funkcja ładowania profilu z API
  const loadProfile = useCallback(async () => {
    if (profileId === 'new') {
      setViewModel(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setViewModel(prev => ({ ...prev, isLoading: true, errors: {} }));
      
      const response = await fetch(`/api/npc_profiles/${profileId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profil nie został znaleziony');
        }
        if (response.status === 403) {
          throw new Error('Nie masz uprawnień do edycji tego profilu');
        }
        throw new Error(`Błąd podczas ładowania profilu: ${response.statusText}`);
      }

      const profile: NpcProfileDTO = await response.json();
      const initialFormData = profileToFormData(profile);
      
      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
      setViewModel(prev => ({
        ...prev,
        profile,
        isLoading: false,
        errors: {}
      }));
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setViewModel(prev => ({
        ...prev,
        isLoading: false,
        errors: { 
          general: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd' 
        }
      }));
    }
  }, [profileId]);

  // Funkcja aktualizacji pola
  const updateField = useCallback((field: keyof ProfileFormData, value: any) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      
      // Sprawdzenie czy formularz został zmieniony
      const isDirty = JSON.stringify(newFormData) !== JSON.stringify(originalFormData);
      
      // Walidacja pola
      const fieldError = validateField(field, value, validationRules[field]);
      const newErrors = { ...viewModel.errors };
      
      if (fieldError) {
        newErrors[field] = fieldError;
      } else {
        delete newErrors[field];
      }
      
      // Sprawdzenie czy cały formularz jest poprawny
      const allErrors = validateForm(newFormData);
      const isValid = Object.keys(allErrors).length === 0;
      
      setViewModel(prev => ({
        ...prev,
        errors: newErrors,
        isDirty,
        isValid
      }));
      
      return newFormData;
    });
  }, [viewModel.errors, originalFormData]);

  // Funkcja walidacji pola (dla onBlur)
  const validateFieldOnBlur = useCallback((field: keyof ProfileFormData) => {
    const fieldError = validateField(field, formData[field], validationRules[field]);
    
    setViewModel(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: fieldError || undefined
      }
    }));
  }, [formData]);

  // Funkcja walidacji całego formularza
  const validateFormData = useCallback(() => {
    const errors = validateForm(formData);
    const isValid = Object.keys(errors).length === 0;
    
    setViewModel(prev => ({
      ...prev,
      errors,
      isValid
    }));
    
    return isValid;
  }, [formData]);

  // Funkcja zapisywania profilu
  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!validateFormData()) {
      return false;
    }

    try {
      setViewModel(prev => ({ ...prev, isSubmitting: true, errors: {} }));
      
      const commandData = formDataToCommand(formData);
      const isNewProfile = profileId === 'new';
      
      const url = isNewProfile ? '/api/npc_profiles' : `/api/npc_profiles/${profileId}`;
      const method = isNewProfile ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commandData)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Dane formularza są nieprawidłowe');
        }
        if (response.status === 403) {
          throw new Error('Nie masz uprawnień do wykonania tej operacji');
        }
        if (response.status === 404) {
          throw new Error('Profil nie został znaleziony');
        }
        throw new Error(`Błąd podczas zapisywania: ${response.statusText}`);
      }

      const savedProfile: NpcProfileDTO = await response.json();
      const savedFormData = profileToFormData(savedProfile);
      
      setOriginalFormData(savedFormData);
      setViewModel(prev => ({
        ...prev,
        profile: savedProfile,
        isSubmitting: false,
        isDirty: false,
        errors: {}
      }));
      
      return true;
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setViewModel(prev => ({
        ...prev,
        isSubmitting: false,
        errors: { 
          general: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd podczas zapisywania' 
        }
      }));
      return false;
    }
  }, [formData, profileId, validateFormData]);

  // Funkcja resetowania formularza
  const resetForm = useCallback(() => {
    setFormData(originalFormData);
    setViewModel(prev => ({
      ...prev,
      errors: {},
      isDirty: false,
      isValid: true
    }));
  }, [originalFormData]);

  // Ładowanie profilu przy inicjalizacji
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Zwracanie obiektu z pełnym API hooka
  return {
    ...viewModel,
    formData,
    updateField,
    validateField: validateFieldOnBlur,
    validateForm: validateFormData,
    saveProfile,
    resetForm,
    loadProfile
  };
}; 