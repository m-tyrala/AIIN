# Plan implementacji widoku Dashboard NPC

## 1. Przegląd
Dashboard NPC jest głównym widokiem aplikacji służącym do zarządzania profilami postaci niezależnych (NPC) w grach RPG. Widok umożliwia przeglądanie, filtrowanie, sortowanie i wyszukiwanie profili NPC, a także szybki dostęp do funkcji tworzenia, edycji i usuwania profili. Dashboard zapewnia mistrzom gier efektywne zarządzanie ich bazą postaci z intuicyjnym interfejsem i responsywnym designem.

## 2. Routing widoku
- **Ścieżka:** `/`
- **Typ:** Chroniona strona (wymaga autoryzacji)
- **Plik:** `src/pages/index.astro`
- **Komponent główny:** `DashboardPage` (React)

## 3. Struktura komponentów
```
DashboardPage (React)
├── DashboardHeader
│   ├── AppTitle
│   ├── CreateNpcButton
│   └── UserActions
│       └── LogoutButton
├── FilterSection
│   ├── SearchInput
│   ├── PublicProfileFilter
│   └── SortSelector
├── NpcListSection
│   ├── LoadingSpinner (warunkowy)
│   ├── ErrorMessage (warunkowy)
│   ├── EmptyState (warunkowy)
│   └── NpcGrid
│       └── NpcCard[]
│           ├── NpcBasicInfo
│           ├── NpcMetadata
│           └── NpcActions
└── PaginationControls
```

## 4. Szczegóły komponentów

### DashboardPage
- **Opis:** Główny kontener zarządzający stanem całego widoku dashboard, obsługuje logikę biznesową, wywołania API i koordynuje komunikację między komponentami potomnymi.
- **Główne elementy:** div container z sekcjami header, filters, content, pagination
- **Obsługiwane interakcje:** 
  - Inicjalizacja danych przy pierwszym załadowaniu
  - Odświeżanie listy po zmianach filtrów
  - Obsługa akcji CRUD na profilach
- **Obsługiwana walidacja:** 
  - Sprawdzenie autoryzacji użytkownika
  - Walidacja parametrów paginacji (page >= 1, limit 1-100)
  - Walidacja parametrów sortowania (dozwolone opcje)
- **Typy:** `DashboardViewState`, `DashboardFilters`, `PaginationState`
- **Propsy:** Brak (root component)

### DashboardHeader
- **Opis:** Nagłówek aplikacji zawierający tytuł, główne akcje nawigacyjne i informacje o użytkowniku.
- **Główne elementy:** header element z h1 (tytuł), przycisk "Nowy NPC", menu użytkownika
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku "Nowy NPC" → przekierowanie do formularza tworzenia
  - Kliknięcie "Wyloguj" → proces wylogowania
- **Obsługiwana walidacja:** Sprawdzenie uprawnień przed pokazaniem przycisków akcji
- **Typy:** `User` (informacje o zalogowanym użytkowniku)
- **Propsy:** `user: User`, `onCreateNew: () => void`, `onLogout: () => void`

### FilterSection
- **Opis:** Sekcja grupująca wszystkie kontrolki filtrowania, sortowania i wyszukiwania profili NPC.
- **Główne elementy:** div z flex layout zawierający SearchInput, PublicProfileFilter, SortSelector
- **Obsługiwane interakcje:**
  - Zmiana kryteriów wyszukiwania i filtrowania
  - Propagowanie zmian do komponentu rodzica
- **Obsługiwana walidacja:** Agregacja i walidacja wszystkich filtrów przed przekazaniem
- **Typy:** `DashboardFilters`
- **Propsy:** `filters: DashboardFilters`, `onFiltersChange: (filters: DashboardFilters) => void`

### SearchInput
- **Opis:** Pole wyszukiwania z debouncing do przeszukiwania profili NPC po nazwie, zawodzie i innych polach tekstowych.
- **Główne elementy:** input[type="search"] z ikoną wyszukiwania i przyciskiem czyszczenia
- **Obsługiwane interakcje:**
  - onChange z debouncing (500ms)
  - Czyszczenie pola wyszukiwania
  - Nawigacja klawiaturą (Enter, Escape)
- **Obsługiwana walidacja:**
  - Maksymalna długość wyszukiwanej frazy (200 znaków)
  - Trimowanie białych znaków
  - Sanityzacja danych wejściowych
- **Typy:** `string`
- **Propsy:** `value: string`, `onChange: (value: string) => void`, `placeholder: string`

### PublicProfileFilter
- **Opis:** Checkbox umożliwiający filtrowanie tylko publicznych profili NPC dostępnych dla wszystkich użytkowników.
- **Główne elementy:** checkbox input z label "Tylko publiczne profile"
- **Obsługiwane interakcje:** onChange przy kliknięciu w checkbox lub label
- **Obsługiwana walidacja:** Boolean validation
- **Typy:** `boolean | undefined`
- **Propsy:** `checked: boolean | undefined`, `onChange: (checked: boolean | undefined) => void`

### SortSelector
- **Opis:** Dropdown pozwalający na wybór kryteriów sortowania listy profili NPC.
- **Główne elementy:** select element z opcjami sortowania
- **Obsługiwane interakcje:** onChange przy wyborze nowej opcji sortowania
- **Obsługiwana walidacja:** 
  - Sprawdzenie czy wybrana opcja jest na liście dozwolonych
  - Fallback do domyślnej opcji przy błędnej wartości
- **Typy:** `SortOption`
- **Propsy:** `value: SortOption`, `onChange: (sort: SortOption) => void`

### NpcGrid
- **Opis:** Kontener wyświetlający listę profili NPC w formie siatki (desktop) lub listy (mobile), adaptywny do rozmiaru ekranu.
- **Główne elementy:** div z grid layout (desktop) lub flex column (mobile) zawierający NpcCard komponenty
- **Obsługiwane interakcje:**
  - Przekazywanie akcji z kart NPC do poziomu dashboard
  - Responsive layout switching
- **Obsługiwana walidacja:** Sprawdzenie czy lista profili nie jest pusta
- **Typy:** `NpcProfileDTO[]`
- **Propsy:** `profiles: NpcProfileDTO[]`, `currentUserId: string`, `onView: (id: string) => void`, `onEdit: (id: string) => void`, `onDelete: (id: string) => void`

### NpcCard
- **Opis:** Karta reprezentująca pojedynczy profil NPC z podstawowymi informacjami i przyciskami akcji.
- **Główne elementy:** 
  - Card container z shadow i hover effects
  - Sekcja z nazwą i zawodem NPC
  - Sekcja z metadanymi (data utworzenia, publiczny/prywatny)
  - Sekcja z przyciskami akcji
- **Obsługiwane interakcje:**
  - Kliknięcie na kartę → podgląd profilu
  - Kliknięcie "Edytuj" → przekierowanie do edycji
  - Kliknięcie "Usuń" → dialog potwierdzenia i usunięcie
- **Obsługiwana walidacja:**
  - Sprawdzenie uprawnień do edycji/usunięcia (właściciel lub admin)
  - Walidacja czy profil nadal istnieje przed akcjami
- **Typy:** `NpcProfileDTO`, `User`
- **Propsy:** `profile: NpcProfileDTO`, `currentUserId: string`, `isOwner: boolean`, `onView: (id: string) => void`, `onEdit: (id: string) => void`, `onDelete: (id: string) => void`

### PaginationControls
- **Opis:** Kontrolki nawigacji po stronach z informacjami o bieżącej stronie i możliwością zmiany rozmiaru strony.
- **Główne elementy:** 
  - Przycisk poprzedniej strony
  - Informacja o bieżącej stronie i łącznej liczbie
  - Przycisk następnej strony
  - Selector rozmiaru strony
- **Obsługiwane interakcje:**
  - Nawigacja między stronami
  - Zmiana liczby elementów na stronie
  - Keyboard navigation (arrow keys)
- **Obsługiwana walidacja:**
  - Sprawdzenie granic stron (nie mniej niż 1, nie więcej niż total_pages)
  - Walidacja rozmiaru strony (1-100)
- **Typy:** `PaginationState`
- **Propsy:** `pagination: PaginationState`, `onPageChange: (page: number) => void`, `onLimitChange: (limit: number) => void`

## 5. Typy

### DashboardViewState
```typescript
interface DashboardViewState {
  profiles: NpcProfileDTO[];
  loading: boolean;
  error: string | null;
  filters: DashboardFilters;
  pagination: PaginationState;
  user: User | null;
}
```

### DashboardFilters
```typescript
interface DashboardFilters {
  search: string;
  isPublic?: boolean;
  sort: SortOption;
}
```

### PaginationState
```typescript
interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  role?: string;
}
```

### NpcCardProps
```typescript
interface NpcCardProps {
  profile: NpcProfileDTO;
  currentUserId: string;
  isOwner: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

## 6. Zarządzanie stanem

Stan aplikacji będzie zarządzany przez custom hook `useDashboard` wykorzystujący `useReducer` dla complex state management oraz `useState` dla prostszych stanów lokalnych.

### Custom Hook: useDashboard
```typescript
const useDashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  
  // API calls
  const fetchProfiles = useCallback(async (filters: DashboardFilters, pagination: Partial<PaginationState>) => { ... });
  const deleteProfile = useCallback(async (profileId: string) => { ... });
  
  // Filter handlers
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => { ... });
  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => { ... });
  
  return {
    state,
    actions: {
      fetchProfiles,
      deleteProfile,
      updateFilters,
      updatePagination,
    }
  };
};
```

### Custom Hook: useDebounce
```typescript
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

Stan lokalny komponentów będzie używany dla:
- UI state (hover, focus, temporary values)
- Form inputs przed debouncing
- Modal/dialog states
- Loading states dla pojedynczych akcji

## 7. Integracja API

### Endpoint: GET /api/npc_profiles
- **Typ żądania:** `ListNpcProfilesQuery`
- **Query parameters:**
  ```typescript
  {
    page: number;
    limit: number;
    sort: SortOption;
    is_public?: boolean;
    // search będzie przekształcone na server-side filtering
  }
  ```
- **Typ odpowiedzi:** `PaginatedResponse<NpcProfileDTO>`
- **Wywołanie:** `fetchProfiles()` w `useDashboard` hook
- **Error handling:** 401 → redirect do login, 400/500 → error state

### Endpoint: DELETE /api/npc_profiles/{id}
- **Typ żądania:** `{ id: string }` (URL parameter)
- **Typ odpowiedzi:** `{ message: string, deleted_id: string }`
- **Wywołanie:** `deleteProfile(id)` w `useDashboard` hook
- **Error handling:** 401 → redirect, 403 → permission error, 404 → profile not found

### API Client Service
```typescript
class NpcProfileApiService {
  static async getProfiles(query: ListNpcProfilesQuery): Promise<PaginatedResponse<NpcProfileDTO>> { ... }
  static async deleteProfile(id: string): Promise<{ message: string, deleted_id: string }> { ... }
}
```

## 8. Interakcje użytkownika

### Wyszukiwanie profili
- **Trigger:** Wpisywanie w SearchInput
- **Mechanizm:** Debounced onChange (500ms) → update filters → fetch profiles
- **Visual feedback:** Loading spinner w trakcie wyszukiwania

### Filtrowanie publicznych profili
- **Trigger:** Zmiana checkbox PublicProfileFilter
- **Mechanizm:** Immediate onChange → update filters → fetch profiles
- **Visual feedback:** Aktualizacja liczby wyników

### Sortowanie
- **Trigger:** Wybór opcji w SortSelector
- **Mechanizm:** onChange → update filters → fetch profiles
- **Visual feedback:** Reorder listy profili

### Paginacja
- **Trigger:** Kliknięcie przycisków Previous/Next lub zmiana page size
- **Mechanizm:** onClick → update pagination → fetch profiles
- **Visual feedback:** Aktualizacja numeru strony i disable buttons

### Tworzenie nowego profilu
- **Trigger:** Kliknięcie przycisku "Nowy NPC"
- **Mechanizm:** onClick → navigate to `/npc/create`
- **Visual feedback:** Transition do nowej strony

### Edycja profilu
- **Trigger:** Kliknięcie przycisku "Edytuj" na karcie NPC
- **Mechanizm:** onClick → navigate to `/npc/{id}/edit`
- **Visual feedback:** Transition do strony edycji

### Usuwanie profilu
- **Trigger:** Kliknięcie przycisku "Usuń" na karcie NPC
- **Mechanizm:** onClick → confirmation dialog → API call → refresh list
- **Visual feedback:** Modal dialog, loading state, success/error toast

### Wylogowanie
- **Trigger:** Kliknięcie przycisku "Wyloguj"
- **Mechanizm:** onClick → Supabase auth signOut → redirect to login
- **Visual feedback:** Loading state, redirect

## 9. Warunki i walidacja

### Autoryzacja dostępu
- **Komponent:** DashboardPage
- **Warunek:** Użytkownik musi być zalogowany
- **Weryfikacja:** Sprawdzenie sesji Supabase przy mount
- **Wpływ na UI:** Redirect do `/login` jeśli nie zalogowany

### Uprawnienia do usuwania profili
- **Komponent:** NpcCard → DeleteButton
- **Warunek:** `profile.user_id === currentUser.id || currentUser.role === 'admin'`
- **Weryfikacja:** Przy renderowaniu przycisku usuwania
- **Wpływ na UI:** Przycisk "Usuń" widoczny tylko dla właściciela/admina

### Parametry paginacji
- **Komponent:** PaginationControls
- **Warunki:** 
  - `page >= 1 && page <= totalPages`
  - `limit >= 1 && limit <= 100`
- **Weryfikacja:** Przed wywołaniem API
- **Wpływ na UI:** Disable przycisków Previous/Next, ograniczenie wyboru page size

### Parametry wyszukiwania
- **Komponent:** SearchInput
- **Warunki:**
  - `search.length <= 200`
  - `search.trim() !== search` → auto-trim
- **Weryfikacja:** onChange handler
- **Wpływ na UI:** Ograniczenie długości inputu, automatyczne czyszczenie

### Parametry sortowania
- **Komponent:** SortSelector
- **Warunek:** Wartość musi być jedną z dozwolonych opcji `SortOption`
- **Weryfikacja:** Przy wyborze opcji z dropdown
- **Wpływ na UI:** Fallback do domyślnej opcji przy błędnej wartości

## 10. Obsługa błędów

### Błędy autoryzacji (401 Unauthorized)
- **Obsługa:** Automatyczne przekierowanie do strony logowania
- **UI:** Loading spinner podczas przekierowania
- **Message:** "Sesja wygasła. Przekierowywanie do logowania..."

### Błędy uprawnień (403 Forbidden)
- **Obsługa:** Toast error message, odświeżenie listy
- **UI:** Error toast z opisem problemu
- **Message:** "Brak uprawnień do wykonania tej operacji"

### Błędy walidacji (400 Bad Request)
- **Obsługa:** Wyświetlenie szczegółów błędu walidacji
- **UI:** Error message pod odpowiednim polem lub toast
- **Message:** Specyficzny opis błędu walidacji

### Błędy serwera (500 Internal Server Error)
- **Obsługa:** Error state z możliwością retry
- **UI:** Error message z przyciskiem "Spróbuj ponownie"
- **Message:** "Wystąpił błąd serwera. Spróbuj ponownie."

### Błędy sieci (Network Error)
- **Obsługa:** Offline mode indicator, retry mechanism
- **UI:** Banner informujący o problemach z połączeniem
- **Message:** "Brak połączenia z internetem. Sprawdź połączenie."

### Błąd "Profil nie znaleziony" (404)
- **Obsługa:** Usunięcie profilu z local state, toast info
- **UI:** Fade out animation karty, info toast
- **Message:** "Profil został usunięty przez innego użytkownika"

### Loading states
- **Initial load:** Loading spinner w miejscu listy profili
- **Filter/search:** Loading overlay na istniejącej liście
- **Delete operation:** Loading spinner na przycisku usuwania
- **Pagination:** Loading state na przyciskach paginacji

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików
- Utworzenie `src/pages/index.astro` jako wrapper dla React komponentu
- Utworzenie katalogu `src/components/dashboard/`
- Utworzenie podstawowej struktury komponentów React

### Krok 2: Implementacja typów i schematów
- Dodanie nowych typów do `src/types.ts` (DashboardViewState, DashboardFilters, PaginationState)
- Utworzenie schematów walidacji Zod w `src/lib/schemas/dashboard.schema.ts`
- Rozszerzenie istniejących typów o potrzebne pola

### Krok 3: Implementacja custom hooks
- Utworzenie `src/hooks/useDashboard.ts` z logiką stanu i API calls
- Implementacja `src/hooks/useDebounce.ts` dla search input
- Dodanie `src/hooks/useAuth.ts` jeśli nie istnieje

### Krok 4: Implementacja komponentów atomowych
- `SearchInput` z debouncing i walidacją
- `PublicProfileFilter` jako checkbox komponent
- `SortSelector` z opcjami sortowania
- `LoadingSpinner` i `ErrorMessage`

### Krok 5: Implementacja komponentów złożonych
- `FilterSection` grupujący kontrolki filtrowania
- `NpcCard` z wyświetlaniem profilu i akcjami
- `PaginationControls` z nawigacją stron

### Krok 6: Implementacja kontenerów wysokiego poziomu
- `DashboardHeader` z nawigacją i akcjami użytkownika
- `NpcGrid` z responsive layout
- `DashboardPage` jako główny kontener

### Krok 7: Integracja API i zarządzanie stanem
- Implementacja API client service w `src/lib/services/npc-profile-api.service.ts`
- Połączenie custom hooks z komponentami
- Testowanie przepływu danych i aktualizacji stanu

### Krok 8: Stylowanie i responsive design
- Implementacja stylów Tailwind CSS z focus na responsywność
- Dodanie hover states i transitions
- Testowanie na różnych rozmiarach ekranów

### Krok 9: Obsługa błędów i loading states
- Dodanie error boundaries w React
- Implementacja graceful error handling
- Dodanie loading states dla wszystkich asynchronicznych operacji

### Krok 10: Dostępność i UX
- Dodanie ARIA labels i role attributes
- Implementacja keyboard navigation
- Testowanie z screen readerami
- Optymalizacja performance (React.memo, useMemo, useCallback)

### Krok 11: Testy i walidacja
- Testy jednostkowe dla custom hooks
- Testy integracyjne dla komponentów
- Testy end-to-end dla głównych przepływów użytkownika
- Walidacja zgodności z wymaganiami PRD

### Krok 12: Optymalizacja i finalizacja
- Code review i refaktoring
- Optymalizacja bundla i performance
- Dokumentacja komponentów i hooks
- Przygotowanie do wdrożenia 