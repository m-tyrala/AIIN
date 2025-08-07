import type { ComplexityLevel, NpcProfileDTO } from '../types';

// Główne typy ViewModel
export interface ProfileEditViewModel {
  profile: NpcProfileDTO | null;
  isLoading: boolean;
  isSubmitting: boolean;
  errors: ValidationErrors;
  isDirty: boolean;
  isNewProfile: boolean;
  isValid: boolean;
}

// Dane formularza
export interface ProfileFormData {
  name: string;
  appearance: string;
  profession: string;
  relationship_to_party: string;
  scene_description: string;
  special_traits: string;
  complexity_level: ComplexityLevel;
  is_public: boolean;
}

// Błędy walidacji
export interface ValidationErrors {
  name?: string;
  appearance?: string;
  profession?: string;
  relationship_to_party?: string;
  scene_description?: string;
  special_traits?: string;
  complexity_level?: string;
  is_public?: string;
  general?: string;
}

// Propsy komponentów
export interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

export interface FormTextAreaProps extends FormFieldProps {
  rows?: number;
  autoResize?: boolean;
}

export interface ComplexitySelectProps {
  value: ComplexityLevel;
  onChange: (value: ComplexityLevel) => void;
  error?: string;
  disabled?: boolean;
}

export interface PublicToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface ActionButtonsProps {
  onAccept: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  isNewProfile: boolean;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

// Reguły walidacji
export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  custom?: (value: string) => string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
} 