# Plan implementacji widoku Formularza Edycji Profilu NPC

## 1. Przegląd

Widok formularza edycji profilu NPC służy do tworzenia nowych profili oraz edycji istniejących profili postaci niezależnych (NPC) w aplikacji wspomagającej mistrzów gier RPG. Widok umożliwia użytkownikowi edycję wszystkich parametrów profilu NPC z walidacją w czasie rzeczywistym, obsługą błędów oraz intuicyjnym interfejsem użytkownika. Formularz obsługuje zarówno tworzenie nowych profili (ścieżka `/new`) jak i edycję istniejących (ścieżka `/{npc-id}`).

## 2. Routing widoku

- **Nowy profil:** `/new`
- **Edycja istniejącego profilu:** `/{npc-id}` gdzie `npc-id` to UUID profilu NPC
- **Implementacja:** Dynamiczne routing w Astro z parametrem `[id].astro` z obsługą wartości `new`

## 3. Struktura komponentów

```
ProfileEditView (Astro page)
├── ProfileEditContainer (React component)
    ├── LoadingSpinner
    ├── ProfileEditForm
    │   ├── FormFieldGroup
    │   │   ├── FormField (name)
    │   │   ├── FormTextArea (appearance)
    │   │   ├── FormField (profession)
    │   │   ├── FormTextArea (relationship_to_party)
    │   │   ├── FormTextArea (scene_description)
    │   │   ├── FormField (special_traits)
    │   │   ├── ComplexitySelect
    │   │   └── PublicToggle
    │   └── FormActions
    │       ├── AcceptButton
    │       ├── CancelButton
    │       └── LoadingIndicator
    └── ToastProvider
        └── ToastNotification
```

## 4. Szczegóły komponentów

### ProfileEditContainer
- **Opis:** Główny kontener React zarządzający stanem całego widoku, obsługujący logikę biznesową, API calls i routing
- **Główne elementy:** Warunkowe renderowanie LoadingSpinner lub ProfileEditForm, obsługa ToastProvider
- **Obsługiwane interakcje:** Inicjalizacja danych, nawigacja, obsługa błędów globalnych
- **Obsługiwana walidacja:** Walidacja uprawnień dostępu, sprawdzenie istnienia profilu
- **Typy:** ProfileEditViewModel, NpcProfileDTO, ApiError
- **Propsy:** `profileId: string | 'new'`

### ProfileEditForm
- **Opis:** Główny formularz zawierający wszystkie pola edycyjne profilu NPC z walidacją inline
- **Główne elementy:** Form element, FormFieldGroup z wszystkimi polami, FormActions
- **Obsługiwane interakcje:** onSubmit, onChange dla pól, walidacja w czasie rzeczywistym
- **Obsługiwana walidacja:** 
  - name: wymagane, max 100 znaków
  - appearance: wymagane, max 500 znaków
  - profession: wymagane, max 100 znaków
  - relationship_to_party: wymagane, max 500 znaków
  - scene_description: wymagane, max 500 znaków
  - special_traits: wymagane, max 150 znaków
  - complexity_level: wymagane, dozwolone wartości enum
  - is_public: boolean
- **Typy:** ProfileFormData, ValidationErrors, FormFieldProps
- **Propsy:** `initialData: NpcProfileDTO | null, onSubmit: (data: ProfileFormData) => Promise<void>, onCancel: () => void, isSubmitting: boolean, errors: ValidationErrors`

### FormField
- **Opis:** Uniwersalny komponent pojedynczego pola tekstowego z etykietą, walidacją i komunikatami błędów
- **Główne elementy:** Label, Input, ErrorMessage, CharacterCounter
- **Obsługiwane interakcje:** onChange, onBlur, onFocus
- **Obsługiwana walidacja:** Sprawdzanie długości, wymagalności, custom validators
- **Typy:** FormFieldProps, ValidationRule
- **Propsy:** `label: string, name: string, value: string, onChange: (value: string) => void, onBlur?: () => void, error?: string, required?: boolean, maxLength?: number, placeholder?: string, disabled?: boolean`

### FormTextArea
- **Opis:** Komponent wieloliniowego pola tekstowego dla dłuższych opisów (appearance, relationship_to_party, scene_description)
- **Główne elementy:** Label, Textarea, ErrorMessage, CharacterCounter
- **Obsługiwane interakcje:** onChange, onBlur, auto-resize
- **Obsługiwana walidacja:** Sprawdzanie długości, wymagalności
- **Typy:** FormTextAreaProps, ValidationRule
- **Propsy:** `label: string, name: string, value: string, onChange: (value: string) => void, onBlur?: () => void, error?: string, required?: boolean, maxLength?: number, placeholder?: string, rows?: number, disabled?: boolean`

### ComplexitySelect
- **Opis:** Komponent dropdown dla wyboru poziomu skomplikowania profilu
- **Główne elementy:** Label, Select, Option elements, ErrorMessage
- **Obsługiwane interakcje:** onChange, onBlur
- **Obsługiwana walidacja:** Sprawdzenie czy wybrana wartość należy do ComplexityLevel enum
- **Typy:** ComplexityLevel, SelectProps
- **Propsy:** `value: ComplexityLevel, onChange: (value: ComplexityLevel) => void, error?: string, disabled?: boolean`

### PublicToggle
- **Opis:** Komponent przełącznika (checkbox/toggle) dla ustawienia publiczności profilu
- **Główne elementy:** Label, Checkbox/Toggle, HelpText
- **Obsługiwane interakcje:** onChange
- **Obsługiwana walidacja:** Sprawdzenie typu boolean
- **Typy:** boolean
- **Propsy:** `checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean`

### FormActions
- **Opis:** Kontener z przyciskami akcji formularza (Akceptuj, Anuluj)
- **Główne elementy:** Button elements, LoadingIndicator
- **Obsługiwane interakcje:** onAccept, onCancel
- **Obsługiwana walidacja:** Sprawdzenie stanu formularza przed submit
- **Typy:** ActionButtonsProps
- **Propsy:** `onAccept: () => void, onCancel: () => void, isSubmitting: boolean, isDirty: boolean, isValid: boolean`

### ToastNotification
- **Opis:** Komponent powiadomień toast dla komunikatów sukcesu, błędów i informacji
- **Główne elementy:** Toast container, Icon, Message, CloseButton
- **Obsługiwane interakcje:** auto-dismiss po 3 sekundach, manual close
- **Obsługiwana walidacja:** Nie dotyczy
- **Typy:** ToastType, ToastMessage
- **Propsy:** `message: string, type: 'success' | 'error' | 'info', onClose: () => void, autoClose?: boolean, duration?: number`

## 5. Typy

```typescript
// Główne typy ViewModel
interface ProfileEditViewModel {
  profile: NpcProfileDTO | null;
  isLoading: boolean;
  isSubmitting: boolean;
  errors: ValidationErrors;
  isDirty: boolean;
  isNewProfile: boolean;
  isValid: boolean;
}

// Dane formularza
interface ProfileFormData {
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
interface ValidationErrors {
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
interface FormFieldProps {
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

interface FormTextAreaProps extends FormFieldProps {
  rows?: number;
  autoResize?: boolean;
}

interface ComplexitySelectProps {
  value: ComplexityLevel;
  onChange: (value: ComplexityLevel) => void;
  error?: string;
  disabled?: boolean;
}

interface PublicToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

interface ActionButtonsProps {
  onAccept: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

// Reguły walidacji
interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  custom?: (value: string) => string | null;
}

// API Response types
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
}
```

## 6. Zarządzanie stanem

### Custom Hook: useProfileEdit

```typescript
const useProfileEdit = (profileId: string | 'new') => {
  // Stan lokalny
  const [viewModel, setViewModel] = useState<ProfileEditViewModel>({
    profile: null,
    isLoading: true,
    isSubmitting: false,
    errors: {},
    isDirty: false,
    isNewProfile: profileId === 'new',
    isValid: false
  });

  // Funkcje zarządzania stanem
  const loadProfile = async () => { /* implementacja */ };
  const updateField = (field: keyof ProfileFormData, value: any) => { /* implementacja */ };
  const validateField = (field: keyof ProfileFormData, value: any) => { /* implementacja */ };
  const validateForm = () => { /* implementacja */ };
  const saveProfile = async (formData: ProfileFormData) => { /* implementacja */ };
  const resetForm = () => { /* implementacja */ };

  return {
    ...viewModel,
    updateField,
    validateField,
    validateForm,
    saveProfile,
    resetForm
  };
};
```

### Zarządzanie stanem globalnym

- **React Context:** Opcjonalnie dla współdzielenia stanu toastów między komponentami
- **LocalStorage:** Zapisywanie wersji roboczej formularza (draft)
- **Supabase Context:** Zarządzanie sesją użytkownika i danymi auth

## 7. Integracja API

### GET `/api/npc_profiles/{id}` - Pobieranie profilu
- **Użycie:** Ładowanie danych istniejącego profilu
- **Request:** Brak body, ID w URL
- **Response:** `NpcProfileDTO`
- **Obsługa błędów:** 404 (profil nie istnieje), 403 (brak uprawnień)

### POST `/api/npc_profiles` - Tworzenie profilu
- **Użycie:** Zapisywanie nowego profilu
- **Request:** `CreateNpcProfileCommand`
- **Response:** `NpcProfileDTO` (201 Created)
- **Obsługa błędów:** 400 (błędy walidacji), 401 (unauthorized)

### PUT `/api/npc_profiles/{id}` - Aktualizacja profilu
- **Użycie:** Zapisywanie zmian w istniejącym profilu
- **Request:** `UpdateNpcProfileCommand`
- **Response:** `NpcProfileDTO` (200 OK)
- **Obsługa błędów:** 400 (błędy walidacji), 403 (brak uprawnień), 404 (nie znaleziono)

## 8. Interakcje użytkownika

### Edycja pól formularza
- **Akcja:** Użytkownik wprowadza tekst w pole
- **Obsługa:** onChange -> updateField -> walidacja inline -> aktualizacja stanu
- **Wynik:** Natychmiastowa walidacja, wyświetlenie błędów, licznik znaków

### Zapisywanie formularza (Akceptuj)
- **Akcja:** Kliknięcie przycisku "Akceptuj"
- **Obsługa:** Walidacja całego formularza -> API call -> sukces/błąd
- **Wynik:** Przekierowanie do listy profili lub toast z błędem

### Anulowanie edycji (Anuluj)
- **Akcja:** Kliknięcie przycisku "Anuluj"
- **Obsługa:** Sprawdzenie isDirty -> potwierdzenie -> nawigacja
- **Wynik:** Powrót do poprzedniej strony lub lista profili

### Auto-zapis (opcjonalnie)
- **Akcja:** Automatyczne zapisywanie wersji roboczej
- **Obsługa:** Debounced zapisywanie do localStorage
- **Wynik:** Możliwość przywrócenia formularza po przypadkowym zamknięciu

## 9. Warunki i walidacja

### Walidacja pól formularza
- **name:** Wymagane, min 1 znak, max 100 znaków, trimmed
- **appearance:** Wymagane, min 1 znak, max 500 znaków
- **profession:** Wymagane, min 1 znak, max 100 znaków, trimmed
- **relationship_to_party:** Wymagane, min 1 znak, max 500 znaków
- **scene_description:** Wymagane, min 1 znak, max 500 znaków
- **special_traits:** Wymagane, min 1 znak, max 150 znaków
- **complexity_level:** Wymagane, jedna z wartości enum ('uproszczony', 'zwykły', 'szczegółowy')
- **is_public:** Boolean, domyślnie false

### Walidacja uprawnień
- **Nowy profil:** Użytkownik musi być zalogowany
- **Edycja profilu:** Użytkownik musi być właścicielem profilu lub adminem
- **Sprawdzenie:** Przed załadowaniem danych i przed zapisem

### Walidacja w czasie rzeczywistym
- **Trigger:** onChange, onBlur
- **Implementacja:** Debounced validation (300ms delay)
- **Wyświetlanie:** Błędy pod polami, zmiana kolorów ramek

## 10. Obsługa błędów

### Błędy walidacji
- **Źródło:** Walidacja lokalna lub response API 400
- **Obsługa:** Wyświetlenie błędów pod odpowiednimi polami
- **UI:** Czerwone ramki pól, komunikaty błędów

### Błędy autoryzacji (401, 403)
- **Źródło:** API response
- **Obsługa:** Przekierowanie do strony logowania lub komunikat o braku uprawnień
- **UI:** Toast notification + przekierowanie

### Błędy sieciowe
- **Źródło:** Brak połączenia, timeout, 500 server error
- **Obsługa:** Retry mechanism, komunikat o błędzie sieci
- **UI:** Toast notification z opcją ponowienia

### Błędy ładowania danych (404)
- **Źródło:** Profil nie istnieje
- **Obsługa:** Przekierowanie do listy profili z komunikatem
- **UI:** Toast notification + przekierowanie

### Błędy nieoczekiwane
- **Źródło:** Inne błędy aplikacji
- **Obsługa:** Logowanie błędu, komunikat ogólny
- **UI:** Toast notification z opcją zgłoszenia błędu

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików
- Utworzenie `src/pages/[id].astro` dla routingu
- Utworzenie `src/components/ProfileEdit/` directory
- Przygotowanie typów w `src/types/profile-edit.ts`

### Krok 2: Implementacja podstawowych komponentów UI
- Implementacja `FormField` i `FormTextArea` z Shadcn/ui
- Implementacja `ComplexitySelect` z opcjami enum
- Implementacja `PublicToggle` jako checkbox/switch
- Testowanie komponentów w Storybook

### Krok 3: Implementacja custom hook useProfileEdit
- Stworzenie `src/hooks/useProfileEdit.ts`
- Implementacja podstawowego zarządzania stanem
- Dodanie funkcji walidacji pól
- Testowanie hooka

### Krok 4: Implementacja głównego formularza
- Stworzenie `ProfileEditForm` component
- Integracja wszystkich pól z custom hook
- Implementacja walidacji w czasie rzeczywistym
- Dodanie obsługi submit i cancel

### Krok 5: Implementacja integracji API
- Dodanie funkcji API calls do custom hook
- Obsługa loading states
- Implementacja error handling
- Testowanie z mock data

### Krok 6: Implementacja kontainera głównego
- Stworzenie `ProfileEditContainer` z logiką routingu
- Integracja z Supabase auth
- Obsługa uprawnień dostępu
- Implementacja nawigacji

### Krok 7: Implementacja systemu powiadomień
- Stworzenie `ToastProvider` i `ToastNotification`
- Integracja z error handling
- Implementacja auto-dismiss
- Dodanie animacji

### Krok 8: Implementacja strony Astro
- Stworzenie `[id].astro` z integracją React
- Dodanie SSR dla SEO i performance
- Implementacja middleware auth check
- Integracja z layoutem aplikacji

### Krok 9: Stylowanie i responsywność
- Implementacja stylów z Tailwind CSS
- Dodanie responsywnych breakpoints
- Implementacja dark mode support
- Testowanie na różnych urządzeniach

### Krok 10: Optymalizacja i testy
- Dodanie lazy loading dla komponentów
- Implementacja memoization gdzie potrzebne
- Napisanie testów jednostkowych
- Testy E2E z Playwright

### Krok 11: Accessibility i UX
- Dodanie ARIA labels i roles
- Implementacja keyboard navigation
- Testowanie screen reader compatibility
- Optymalizacja focus management

### Krok 12: Finalizacja i dokumentacja
- Code review i refactoring
- Przygotowanie migration guide