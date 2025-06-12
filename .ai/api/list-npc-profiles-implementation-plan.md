# API Endpoint Implementation Plan: List NPC Profiles

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania spaginowanej listy profili NPC z opcjonalnym filtrowaniem i sortowaniem. Umożliwia użytkownikom przeglądanie własnych profili oraz publicznych profili innych użytkowników w systemie wspomagania mistrzów gry w RPG.

**Kluczowe funkcjonalności:**
- Pobieranie spaginowanej listy profili NPC
- Filtrowanie według publiczności (is_public) i właściciela (user_id)
- Sortowanie według różnych kryteriów (created_at, updated_at, name)
- Automatyczne filtrowanie według uprawnień użytkownika
- Logowanie operacji dostępu do tabeli npc_profile_logs
- Zwrócenie struktury z danymi i metadanymi paginacji

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/npc_profiles`
- **Content-Type:** Nie dotyczy (GET request)
- **Wymagana autoryzacja:** Tak (sesja użytkownika)

### Parametry:
**Opcjonalne (query parameters):**
- `page`: number (default: 1, min: 1) - numer strony dla paginacji
- `limit`: number (default: 10, min: 1, max: 100) - liczba elementów na stronę
- `sort`: string (default: "created_at desc") - kryteria sortowania
  - Dozwolone wartości: "created_at asc", "created_at desc", "updated_at asc", "updated_at desc", "name asc", "name desc"
- `is_public`: boolean - filtrowanie według publiczności profili
- `user_id`: string (UUID) - filtrowanie według właściciela (tylko dla adminów lub własnych profili)

### Query Parameters Example:
```
GET /api/npc_profiles?page=1&limit=20&sort=created_at desc&is_public=true
```

## 3. Wykorzystywane typy

### DTOs i Command Models:
- **`NpcProfileDTO`** - już istnieje w types.ts
- **`ListNpcProfilesQuery`** - nowy typ dla parametrów query
- **`PaginatedResponse<T>`** - typ dla odpowiedzi z paginacją
- **`SortOption`** - enum dla opcji sortowania

### Nowe typy do utworzenia:
```typescript
// src/types.ts - dodać nowe typy
export type SortOption = 
  | "created_at asc" 
  | "created_at desc" 
  | "updated_at asc" 
  | "updated_at desc" 
  | "name asc" 
  | "name desc";

export interface ListNpcProfilesQuery {
  page?: number;
  limit?: number;
  sort?: SortOption;
  is_public?: boolean;
  user_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
```

### Zod Schemas (do utworzenia):
```typescript
// src/lib/schemas/npc-profile.schema.ts - rozszerzenie istniejącego
export const listNpcProfilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum([
    "created_at asc", "created_at desc",
    "updated_at asc", "updated_at desc", 
    "name asc", "name desc"
  ]).default("created_at desc"),
  is_public: z.coerce.boolean().optional(),
  user_id: z.string().uuid().optional()
});
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "appearance": "string", 
      "profession": "string",
      "relationship_to_party": "string",
      "scene_description": "string",
      "special_traits": "string",
      "complexity_level": "uproszczony | zwykły | szczegółowy",
      "is_public": "boolean",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### Odpowiedzi błędów:
- **400 Bad Request:** Nieprawidłowe parametry query
- **401 Unauthorized:** Brak autoryzacji użytkownika
- **500 Internal Server Error:** Błąd serwera/bazy danych

## 5. Przepływ danych

1. **Otrzymanie żądania HTTP GET**
   - Endpoint: `/api/npc_profiles`
   - Parsowanie query parameters

2. **Weryfikacja autoryzacji**
   - Sprawdzenie sesji użytkownika via Supabase
   - Pobranie user_id i user_role z context.locals.supabase

3. **Walidacja parametrów query**
   - Użycie Zod schema do walidacji query parameters
   - Sprawdzenie zakresów numerycznych i enum values
   - Walidacja UUID dla user_id

4. **Przygotowanie filtrów bezpieczeństwa**
   - Dla zwykłych użytkowników: (user_id = current_user_id OR is_public = true)
   - Dla adminów: możliwość filtrowania według dowolnego user_id

5. **Wywołanie serwisu biznesowego**
   - `NpcProfileService.listProfiles()`
   - Przekazanie walidowanych parametrów + user context

6. **Operacje bazodanowe**
   - COUNT query dla total liczby rekordów
   - SELECT query z LIMIT/OFFSET dla paginacji
   - WHERE clauses dla filtrowania
   - ORDER BY dla sortowania

7. **Przygotowanie odpowiedzi**
   - Mapowanie wyników na `NpcProfileDTO[]`
   - Obliczenie metadanych paginacji
   - Zwrócenie `PaginatedResponse<NpcProfileDTO>`

8. **Logowanie operacji (opcjonalne)**
   - INSERT do tabeli `npc_profile_logs` (operacja OPEN)

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja:
- **Wymagana sesja użytkownika** - weryfikacja via Supabase middleware
- **Automatyczne filtrowanie uprawnień** - użytkownicy widzą tylko swoje + publiczne profile
- **Admin override** - admini mogą filtrować według dowolnego user_id
- **User isolation** - niemożność dostępu do prywatnych profili innych użytkowników

### Walidacja danych:
- **Zod schema validation** - ochrona przed nieprawidłowymi parametrami
- **SQL injection prevention** - parametryzowane zapytania i enum validation
- **Range validation** - limity dla page/limit parameters
- **UUID validation** - sprawdzenie formatu user_id

### Dodatkowe zabezpieczenia:
- **Rate limiting** - ograniczenie częstotliwości requestów na endpoint
- **Data exposure limits** - maksymalny limit na stronę (100 elementów)
- **Sort parameter whitelist** - tylko dozwolone opcje sortowania
- **Query complexity limits** - unikanie kosztownych zapytań

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "page",
      "message": "Number must be greater than or equal to 1"
    },
    {
      "field": "sort", 
      "message": "Invalid enum value. Expected 'created_at asc' | 'created_at desc' | ..."
    }
  ]
}
```

### Błędy autoryzacji (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "User session required"
}
```

### Błędy serwera (500 Internal Server Error):
```json
{
  "error": "Internal server error", 
  "message": "Failed to retrieve NPC profiles"
}
```

### Scenariusze błędów:
1. **Brak sesji użytkownika** → 401
2. **Nieprawidłowe parametry query** → 400
3. **Przekroczenie limitów paginacji** → 400
4. **Nieprawidłowy format UUID** → 400
5. **Nieprawidłowe opcje sortowania** → 400
6. **Błąd połączenia z bazą danych** → 500
7. **Timeout zapytania bazodanowego** → 500

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:
- **Database COUNT queries** - może być kosztowne dla dużych tabel
- **Complex WHERE clauses** - filtrowanie z wieloma warunkami
- **Large result sets** - bez odpowiednich indeksów
- **User session verification** - zapytanie do Supabase Auth

### Strategie optymalizacji:
- **Database indexing** - indeksy na kolumnach used w WHERE i ORDER BY
- **Connection pooling** - używanie Supabase connection pool
- **Query optimization** - optymalne zapytania SQL z EXPLAIN ANALYZE
- **Caching strategy** - cache dla często używanych zapytań (opcjonalnie)
- **Lazy loading** - rozważenie cursor-based pagination dla dużych zbiorów

### Zalecane indeksy bazodanowe:
```sql
-- Composite index dla najczęstszych zapytań
CREATE INDEX idx_npc_profiles_user_public_created 
ON npc_profiles(user_id, is_public, created_at DESC);

-- Index dla sortowania po name
CREATE INDEX idx_npc_profiles_name ON npc_profiles(name);

-- Index dla pełnego text search (przyszłe rozszerzenie)
CREATE INDEX idx_npc_profiles_search ON npc_profiles 
USING gin(to_tsvector('english', name || ' ' || profession));
```

### Monitoring:
- **Query performance** - monitorowanie czasu wykonania zapytań
- **Response times** - śledzenie czasu odpowiedzi endpointu
- **Cache hit rates** - jeśli implementujemy cache
- **Error rates** - monitoring błędów 4xx/5xx

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie typów i schematów
```bash
# Rozszerzyć src/types.ts o nowe typy
# Rozszerzyć src/lib/schemas/npc-profile.schema.ts o listNpcProfilesQuerySchema
```

### Krok 2: Implementacja serwisu biznesowego
```bash
# Rozszerzyć src/lib/services/npc-profile.service.ts
# Zaimplementować funkcję listProfiles() z paginacją i filtrowaniem
# Dodać helper functions dla budowania zapytań SQL
```

### Krok 3: Optymalizacja bazy danych
```bash
# Utworzyć migracje Supabase dla zalecanych indeksów
# Przetestować wydajność zapytań z EXPLAIN ANALYZE
```

### Krok 4: Utworzenie endpointu API
```bash
# Rozszerzyć src/pages/api/npc_profiles.ts o funkcję GET()
# Zaimplementować walidację, autoryzację i obsługę błędów
# Dodać logowanie operacji OPEN
```

### Krok 5: Zabezpieczenia i middleware
```bash
# Sprawdzić src/middleware/index.ts
# Dodać rate limiting dla GET requests (opcjonalnie)
# Zaimplementować dodatkowe zabezpieczenia
```

### Krok 6: Testy integracyjne
```bash
# Utworzyć testy dla endpoint GET /api/npc_profiles
# Przetestować scenariusze paginacji, sortowania i filtrowania
# Sprawdzić bezpieczeństwo i autoryzację
# Testy wydajnościowe dla dużych zbiorów danych
```

### Krok 7: Dokumentacja i optymalizacja
```bash
# Dodać komentarze do kodu
# Przygotować dokumentację API z przykładami
# Zoptymalizować zapytania na podstawie testów wydajnościowych
```

### Kolejność implementacji:
1. **Types and schemas** (types.ts, npc-profile.schema.ts)
2. **Database optimization** (indexes, migrations)
3. **Service layer** (npc-profile.service.ts) 
4. **API endpoint** (api/npc_profiles.ts - GET method)
5. **Security enhancements** (middleware updates)
6. **Testing** (unit and integration tests)
7. **Performance optimization** (query tuning, monitoring)
8. **Documentation** (API documentation)

### Uwagi implementacji:
- **Cursor-based pagination** - rozważyć dla bardzo dużych zbiorów danych w przyszłości
- **Full-text search** - możliwość rozszerzenia o wyszukiwanie tekstowe
- **Caching layer** - Redis/memory cache dla często używanych zapytań
- **API versioning** - przygotowanie na przyszłe zmiany API

Każdy krok powinien być testowany i zweryfikowany przed przejściem do następnego, aby zapewnić stabilność i wydajność implementacji. 