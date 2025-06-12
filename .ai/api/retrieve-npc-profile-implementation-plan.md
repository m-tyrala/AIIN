# API Endpoint Implementation Plan: Retrieve Profile Details

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania szczegółowych informacji o konkretnym profilu NPC na podstawie jego unikalnego identyfikatora UUID. Implementuje kontrolę dostępu, umożliwiając pobieranie profili publicznych przez wszystkich użytkowników oraz prywatnych profili tylko przez ich właścicieli. Każde pomyślne pobranie jest rejestrowane w systemie logów jako operacja 'OPEN'.

**Kluczowe funkcjonalności:**
- Pobieranie pełnych danych profilu NPC
- Kontrola dostępu na podstawie uprawnień użytkownika i statusu publiczności profilu
- Logowanie operacji dostępu
- Walidacja parametrów wejściowych

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/npc_profiles/{id}`
- **Parametry:**
  - **Wymagane:** 
    - `id` (UUID) - Unikalny identyfikator profilu NPC w path parameter
  - **Opcjonalne:** brak
- **Request Body:** brak (metoda GET)
- **Headers wymagane:**
  - `Authorization: Bearer <token>` - token autoryzacji Supabase

## 3. Wykorzystywane typy

**Główne typy DTO:**
```typescript
// Zwracany typ danych
NpcProfileDTO {
  id: string;
  name: string;
  appearance: string;
  profession: string;
  relationship_to_party: string;
  scene_description: string;
  special_traits: string;
  complexity_level: ComplexityLevel;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Typ dla logowania
NpcProfileLogDTO {
  id: string;
  npc_profile_id: string | null;
  operation: 'OPEN';
  operation_timestamp: string;
  duration: number | null;
  user_id: string;
  user_role: string;
}

// Typ pomocniczy
ComplexityLevel = "uproszczony" | "zwykły" | "szczegółowy";
```

## 4. Szczegóły odpowiedzi

**Pomyślna odpowiedź (200 OK):**
```json
{
  "id": "uuid-string",
  "name": "Nazwa NPC",
  "appearance": "Opis wyglądu",
  "profession": "Zawód",
  "relationship_to_party": "Relacja z grupą",
  "scene_description": "Opis sceny",
  "special_traits": "Cechy specjalne",
  "complexity_level": "zwykły",
  "is_public": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "user_id": "user-uuid"
}
```

**Kody statusu:**
- `200 OK` - Profil pomyślnie pobrany
- `400 Bad Request` - Nieprawidłowy format UUID
- `401 Unauthorized` - Brak autoryzacji
- `403 Forbidden` - Brak uprawnień do profilu
- `404 Not Found` - Profil nie istnieje
- `500 Internal Server Error` - Błąd serwera

## 5. Przepływ danych

1. **Walidacja żądania:**
   - Sprawdzenie formatu UUID w parametrze `id`
   - Weryfikacja tokenu autoryzacji Supabase

2. **Pobieranie danych:**
   - Zapytanie do tabeli `npc_profiles` o profil o podanym ID
   - Sprawdzenie czy profil istnieje

3. **Kontrola dostępu:**
   - Jeśli profil jest publiczny (`is_public = true`) - dostęp dla wszystkich
   - Jeśli profil jest prywatny - dostęp tylko dla właściciela (`user_id` = ID zalogowanego użytkownika)

4. **Logowanie operacji:**
   - Wpis do tabeli `npc_profile_logs` z operacją 'OPEN'
   - Rejestracja czasu rozpoczęcia i zakończenia operacji

5. **Zwrócenie odpowiedzi:**
   - Formatowanie danych zgodnie z `NpcProfileDTO`
   - Zwrócenie JSON z kodem 200

**Interakcje z bazą danych:**
- SELECT na tabeli `npc_profiles` 
- INSERT do tabeli `npc_profile_logs`
- Potencjalne JOIN z tabelą `users` dla weryfikacji uprawnień

## 6. Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany token Bearer z Supabase Auth
- Weryfikacja ważności tokenu przez middleware Supabase

**Autoryzacja:**
- Sprawdzenie czy użytkownik ma dostęp do profilu:
  - Właściciel profilu ma zawsze dostęp
  - Inni użytkownicy mają dostęp tylko do profili publicznych

**Walidacja danych:**
- Strict walidacja UUID format dla parametru `id`
- Sanityzacja danych wejściowych przed zapytaniami do bazy

**Ochrona przed atakami:**
- Rate limiting na poziomie API
- Ochrona przed enumeration attacks poprzez jednakowe odpowiedzi 403/404
- Prepared statements dla zapytań SQL

**Logowanie bezpieczeństwa:**
- Rejestracja prób dostępu do nieautoryzowanych zasobów
- Monitoring podejrzanych wzorców dostępu

## 7. Obsługa błędów

**400 Bad Request:**
- Nieprawidłowy format UUID w parametrze `id`
- Brak wymaganego parametru `id`
```json
{
  "error": "Invalid UUID format",
  "code": "INVALID_UUID",
  "message": "The provided ID is not a valid UUID"
}
```

**401 Unauthorized:**
- Brak tokenu autoryzacji
- Nieprawidłowy token
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**403 Forbidden:**
- Próba dostępu do prywatnego profilu innego użytkownika
```json
{
  "error": "Forbidden",
  "code": "ACCESS_DENIED",
  "message": "You don't have permission to access this profile"
}
```

**404 Not Found:**
- Profil o podanym ID nie istnieje
```json
{
  "error": "Not Found",
  "code": "PROFILE_NOT_FOUND",
  "message": "Profile with the specified ID does not exist"
}
```

**500 Internal Server Error:**
- Błędy bazy danych
- Błędy serwera
```json
{
  "error": "Internal Server Error",
  "code": "SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

## 8. Rozważania dotyczące wydajności

**Optymalizacje zapytań:**
- Indeks na kolumnie `id` w tabeli `npc_profiles` (PRIMARY KEY)
- Indeks na kolumnie `user_id` dla szybkiej weryfikacji uprawnień
- Optymalizacja zapytań SELECT z odpowiednimi indeksami

**Caching:**
- Rozważenie cache'owania profili publicznych (Redis/Memcached)
- Cache headers dla statycznych danych profili
- ETags dla conditional requests

**Monitoring wydajności:**
- Pomiar czasów odpowiedzi API
- Monitoring wykorzystania zasobów bazy danych
- Alerty przy przekroczeniu progów wydajności

**Limity:**
- Rate limiting: maksymalnie 100 żądań/minutę na użytkownika
- Timeout zapytań: maksymalnie 5 sekund na operację

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików
- Utworzenie pliku API endpoint: `src/pages/api/npc_profiles/[id].ts`
- Przygotowanie serwisu: `src/lib/services/npcProfileService.ts`
- Dodanie walidacji: `src/lib/schemas/npcProfileSchemas.ts`

### Krok 2: Implementacja walidacji i schematów
- Definicja schematu walidacji UUID używając biblioteki walidacji (np. zod)
- Implementacja pomocniczych funkcji walidacji
- Testy jednostkowe dla walidacji

### Krok 3: Implementacja serwisu danych
- Utworzenie funkcji `getNpcProfileById` w serwisie
- Implementacja logiki sprawdzania uprawnień dostępu
- Dodanie funkcji logowania operacji
- Obsługa błędów na poziomie serwisu

### Krok 4: Implementacja endpoint API
- Implementacja handlera GET w pliku `[id].ts`
- Integracja z middleware autoryzacji Supabase
- Połączenie z serwisem danych
- Implementacja odpowiedzi w formacie JSON

### Krok 5: Obsługa błędów i walidacja
- Implementacja jednolitej obsługi błędów
- Dodanie walidacji parametrów wejściowych
- Implementacja odpowiednich kodów statusu HTTP
- Dodanie logowania błędów

### Krok 6: Testy funkcjonalności
- Testy jednostkowe dla serwisu
- Testy integracyjne dla API endpoint
- Testy autoryzacji i kontroli dostępu
- Testy przypadków błędów

### Krok 7: Optymalizacja wydajności
- Analiza wydajności zapytań do bazy danych
- Implementacja indeksów jeśli potrzebne
- Dodanie monitoringu wydajności
- Optymalizacja zapytań SQL

### Krok 8: Dokumentacja i wdrożenie
- Dokumentacja API endpoint
- Przygotowanie przykładów użycia
- Testy akceptacyjne
- Wdrożenie na środowisko produkcyjne

### Krok 9: Monitoring i utrzymanie
- Konfiguracja alertów dla błędów API
- Monitoring metryk wydajności
- Regularne przeglądy logów bezpieczeństwa
- Aktualizacja dokumentacji w przypadku zmian 