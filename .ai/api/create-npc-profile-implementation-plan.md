# API Endpoint Implementation Plan: Create NPC Profile

## 1. Przegląd punktu końcowego

Endpoint służy do tworzenia nowego profilu NPC (Non-Player Character) w systemie wspomagania mistrzów gry w RPG. Pozwala użytkownikom na utworzenie szczegółowego profilu postaci z różnymi poziomami złożoności i opcją udostępniania publicznego.

**Kluczowe funkcjonalności:**
- Tworzenie profilu NPC z pełnymi danymi
- Walidacja danych wejściowych zgodnie z ograniczeniami bazy danych  
- Automatyczne przypisanie user_id z sesji użytkownika
- Logowanie operacji do tabeli npc_profile_logs
- Zwrócenie pełnego obiektu profilu z wygenerowanymi polami (id, timestamps)

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/npc_profiles`
- **Content-Type:** `application/json`
- **Wymagana autoryzacja:** Tak (sesja użytkownika)

### Parametry:
- **Wymagane (wszystkie pola request body):**
  - `name`: string (max 100 chars) - imię/nazwa NPC
  - `appearance`: string (max 500 chars) - opis wyglądu
  - `profession`: string (max 100 chars) - zawód/profesja
  - `relationship_to_party`: string (max 500 chars) - relacja z grupą graczy
  - `scene_description`: string (max 500 chars) - opis sceny/kontekstu
  - `special_traits`: string (max 150 chars) - specjalne cechy
  - `complexity_level`: enum ("uproszczony" | "zwykły" | "szczegółowy")
  - `is_public`: boolean - czy profil ma być publiczny

- **Opcjonalne:** Brak

### Request Body:
```json
{
  "name": "string (max 100 chars)",
  "appearance": "string (max 500 chars)", 
  "profession": "string (max 100 chars)",
  "relationship_to_party": "string (max 500 chars)",
  "scene_description": "string (max 500 chars)",
  "special_traits": "string (max 150 chars)",
  "complexity_level": "uproszczony | zwykły | szczegółowy",
  "is_public": "boolean"
}
```

## 3. Wykorzystywane typy

### DTOs i Command Models:
- **`CreateNpcProfileCommand`** - walidacja i typing request body
- **`NpcProfileDTO`** - struktura response object
- **`NpcProfileLogDTO`** - logowanie operacji INSERT
- **`ComplexityLevel`** - enum dla poziomów złożoności
- **`OperationType`** - enum dla typu operacji (INSERT)

### Zod Schemas (do utworzenia):
```typescript
// src/lib/schemas/npc-profile.schema.ts
export const createNpcProfileSchema = z.object({
  name: z.string().min(1).max(100),
  appearance: z.string().min(1).max(500),
  profession: z.string().min(1).max(100),
  relationship_to_party: z.string().min(1).max(500),
  scene_description: z.string().min(1).max(500),
  special_traits: z.string().min(1).max(150),
  complexity_level: z.enum(["uproszczony", "zwykły", "szczegółowy"]),
  is_public: z.boolean()
});
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (201 Created):
```json
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
```

### Odpowiedzi błędów:
- **400 Bad Request:** Nieprawidłowe dane wejściowe
- **401 Unauthorized:** Brak autoryzacji użytkownika
- **500 Internal Server Error:** Błąd serwera/bazy danych

## 5. Przepływ danych

1. **Otrzymanie żądania HTTP POST**
   - Endpoint: `/api/npc_profiles`
   - Walidacja Content-Type

2. **Weryfikacja autoryzacji**
   - Sprawdzenie sesji użytkownika via Supabase
   - Pobranie user_id z context.locals.supabase

3. **Walidacja danych wejściowych**
   - Użycie Zod schema do walidacji request body
   - Sprawdzenie długości stringów i enum values

4. **Wywołanie serwisu biznesowego**
   - `NpcProfileService.createProfile()`
   - Przekazanie walidowanych danych + user_id

5. **Operacje bazodanowe**
   - INSERT do tabeli `npc_profiles`
   - INSERT do tabeli `npc_profile_logs` (operacja INSERT)

6. **Przygotowanie odpowiedzi**
   - Pobranie utworzonego obiektu z bazy
   - Mapowanie na `NpcProfileDTO`
   - Zwrócenie response 201 Created

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja:
- **Wymagana sesja użytkownika** - weryfikacja via Supabase middleware
- **Automatyczne przypisanie user_id** - pobranie z sesji, nie z request body
- **Walidacja uprawnień** - użytkownik może tworzyć tylko własne profile

### Walidacja danych:
- **Zod schema validation** - ochrona przed nieprawidłowymi danymi
- **String length limits** - zgodnie z ograniczeniami bazy danych
- **Enum validation** - tylko dozwolone wartości complexity_level
- **Sanitization** - automatyczne przez Supabase (parametryzowane zapytania)

### Dodatkowe zabezpieczenia:
- **Rate limiting** - opcjonalnie, ograniczenie częstotliwości requestów
- **CSRF protection** - wbudowane w Astro
- **Input sanitization** - dodatkowe sprawdzenie niebezpiecznych znaków

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request):
```json
{
  "error": "Validation failed",
  "details": {
    "field": "name",
    "message": "String must contain at most 100 character(s)"
  }
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
  "message": "Failed to create NPC profile"
}
```

### Scenariusze błędów:
1. **Brak sesji użytkownika** → 401
2. **Nieprawidłowy request body** → 400
3. **Przekroczenie limitów długości** → 400  
4. **Nieprawidłowy complexity_level** → 400
5. **Błąd połączenia z bazą danych** → 500
6. **Naruszenie constraints bazy danych** → 500

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:
- **Database INSERT operations** - dwukrotny INSERT (profiles + logs)
- **User session verification** - zapytanie do Supabase Auth
- **Request body parsing** - dla większych opisów (max 500 chars)

### Strategie optymalizacji:
- **Database transaction** - atomic INSERT dla profiles + logs
- **Connection pooling** - używanie Supabase connection pool
- **Async operations** - non-blocking database calls
- **Response caching** - nie dotyczy (POST endpoint)
- **Batch logging** - opcjonalnie, grupowanie logów

### Monitoring:
- **Response times** - monitorowanie czasu odpowiedzi
- **Error rates** - śledzenie błędów 4xx/5xx
- **Database performance** - query execution time

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie schematów walidacji
```bash
# Utworzyć plik src/lib/schemas/npc-profile.schema.ts
# Zdefiniować createNpcProfileSchema z Zod
```

### Krok 2: Implementacja serwisu biznesowego  
```bash
# Utworzyć src/lib/services/npc-profile.service.ts
# Zaimplementować funkcje createProfile() i logOperation()
# Dodać obsługę transakcji bazodanowych
```

### Krok 3: Utworzenie endpointu API
```bash
# Utworzyć src/pages/api/npc_profiles.ts
# Zaimplementować funkcję POST()
# Dodać walidację, autoryzację i obsługę błędów  
```

### Krok 4: Implementacja middleware i zabezpieczeń
```bash
# Sprawdzić src/middleware/index.ts
# Dodać weryfikację sesji użytkownika
# Zaimplementować rate limiting (opcjonalnie)
```

### Krok 5: Testy integracyjne
```bash
# Utworzyć testy dla endpoint POST /api/npc_profiles
# Przetestować scenariusze success i error
# Sprawdzić walidację danych i autoryzację
```

### Krok 6: Dokumentacja i optymalizacja
```bash
# Dodać komentarze do kodu
# Zoptymalizować zapytania bazodanowe
# Przygotować dokumentację API
```

### Kolejność implementacji:
1. **Schema validation** (npc-profile.schema.ts)
2. **Service layer** (npc-profile.service.ts) 
3. **API endpoint** (api/npc_profiles.ts)
4. **Security middleware** (middleware updates)
5. **Testing** (integration tests)
6. **Documentation** (API docs)

Każdy krok powinien być testowany przed przejściem do następnego, aby zapewnić stabilność implementacji. 