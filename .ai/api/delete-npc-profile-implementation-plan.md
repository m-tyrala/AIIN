# API Endpoint Implementation Plan: Delete NPC Profile

## 1. Przegląd punktu końcowego

Endpoint DELETE `/npc_profiles/{id}` służy do usuwania istniejących profili NPC z systemu. Operacja jest ograniczona tylko do właściciela profilu lub administratora systemu. Po pomyślnym usunięciu profilu, operacja jest rejestrowana w tabeli logów w celu audytu i monitorowania.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/npc_profiles/{id}`
- **Parametry:**
  - **Wymagane:** 
    - `id` (UUID): Unikalny identyfikator profilu NPC do usunięcia
  - **Opcjonalne:** brak
- **Request Body:** brak
- **Headers:** 
  - `Authorization`: Bearer token dla uwierzytelnienia użytkownika

## 3. Wykorzystywane typy

```typescript
// Główne typy używane w implementacji
- NpcProfileDTO: Do weryfikacji istnienia profilu
- NpcProfileLogDTO: Do rejestrowania operacji DELETE
- OperationType: Typ "DELETE" dla logowania
```

## 4. Szczegóły odpowiedzi

### Pomyślna odpowiedź (200 OK)
```json
{
  "message": "Profil NPC został pomyślnie usunięty",
  "deleted_id": "uuid-profilu"
}
```

### Kody statusu
- **200 OK:** Profil został pomyślnie usunięty
- **400 Bad Request:** Nieprawidłowy format UUID
- **401 Unauthorized:** Brak uwierzytelnienia
- **403 Forbidden:** Brak uprawnień do usunięcia profilu
- **404 Not Found:** Profil o podanym ID nie istnieje
- **500 Internal Server Error:** Błąd serwera

## 5. Przepływ danych

1. **Walidacja parametrów:**
   - Weryfikacja formatu UUID w parametrze `id`
   - Sprawdzenie obecności tokenu uwierzytelnienia

2. **Uwierzytelnienie i autoryzacja:**
   - Dekodowanie tokenu użytkownika
   - Pobranie informacji o profilu z bazy danych
   - Weryfikacja uprawnień (właściciel lub admin)

3. **Operacja usunięcia:**
   - Rozpoczęcie pomiaru czasu operacji
   - Usunięcie profilu z tabeli `npc_profiles`
   - Zakończenie pomiaru czasu

4. **Logowanie operacji:**
   - Zapis wpisu w tabeli `npc_profile_logs` z operacją DELETE
   - Uwzględnienie czasu trwania operacji

5. **Zwrócenie odpowiedzi:**
   - Komunikat potwierdzający pomyślne usunięcie

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- Wymagany valid Bearer token w nagłówku Authorization
- Weryfikacja tokenu przez middleware Supabase

### Autoryzacja
- Sprawdzenie czy użytkownik jest właścicielem profilu (`user_id` w profilu == `user_id` z tokenu)
- Alternatywnie sprawdzenie czy użytkownik ma rolę `admin`

### Walidacja danych
- Walidacja formatu UUID dla parametru `id`
- Zabezpieczenie przed SQL injection poprzez używanie prepared statements
- Sanityzacja danych wejściowych

### Ochrona zasobów
- Rate limiting dla operacji DELETE
- Logowanie wszystkich prób usunięcia dla audytu

## 7. Obsługa błędów

### Scenariusze błędów i ich obsługa:

1. **400 Bad Request**
   - Nieprawidłowy format UUID
   - Brak wymaganego parametru `id`

2. **401 Unauthorized**
   - Brak tokenu uwierzytelnienia
   - Nieprawidłowy token
   - Token wygasł

3. **403 Forbidden**
   - Użytkownik nie jest właścicielem profilu
   - Użytkownik nie ma roli admin
   - Profil należy do innego użytkownika

4. **404 Not Found**
   - Profil o podanym ID nie istnieje w bazie danych

5. **500 Internal Server Error**
   - Błąd połączenia z bazą danych
   - Błąd podczas operacji DELETE
   - Błąd podczas logowania operacji

### Struktura odpowiedzi błędu:
```json
{
  "error": "Kod błędu",
  "message": "Opis błędu dla użytkownika",
  "details": "Szczegóły techniczne (tylko w trybie dev)"
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje:
- **Indeksowanie:** Wykorzystanie indeksu na kolumnie `id` w tabeli `npc_profiles`
- **Transakcje:** Użycie transakcji do zagwarantowania atomowości operacji
- **Connection pooling:** Wykorzystanie puli połączeń Supabase

### Potencjalne wąskie gardła:
- Operacje I/O z bazą danych
- Walidacja uprawnień użytkownika
- Logowanie operacji

### Monitorowanie:
- Śledzenie czasu odpowiedzi endpoint
- Monitorowanie błędów 403/404
- Analiza częstotliwości operacji DELETE

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików
- Utworzenie pliku `/src/pages/api/npc_profiles/[id].ts`
- Przygotowanie schematu walidacji w `/src/lib/schemas/`

### Krok 2: Implementacja service layer
- Rozszerzenie `NpcProfileService` o metodę `deleteProfile(id: string, userId: string)`
- Implementacja `NpcProfileLogService.logOperation()` jeśli nie istnieje

### Krok 3: Implementacja walidacji
- Dodanie schematu walidacji UUID
- Implementacja middleware autoryzacji

### Krok 4: Implementacja głównej logiki endpoint
- Dekodowanie i walidacja parametrów
- Implementacja logiki usuwania z autoryzacją
- Obsługa błędów i zwracanie odpowiedzi

### Krok 5: Implementacja logowania operacji
- Dodanie wpisu do tabeli `npc_profile_logs`
- Pomiar i rejestracja czasu trwania operacji

### Krok 6: Weryfikacja bezpieczeństwa
- Audyt bezpieczeństwa kodu
- Testy penetracyjne
- Weryfikacja logowania operacji

## 10. Przykład implementacji

### Struktura pliku API:
```typescript
// /src/pages/api/npc_profiles/[id].ts
import type { APIRoute } from 'astro';
import { NpcProfileService } from '@/lib/services/NpcProfileService';
import { validateUuid } from '@/lib/validators';

export const DELETE: APIRoute = async ({ params, request }) => {
  // Implementacja zgodnie z planem
};
```

### Service method:
```typescript
// /src/lib/services/NpcProfileService.ts
async deleteProfile(id: string, userId: string, userRole: string): Promise<void> {
  // Implementacja usuwania z autoryzacją
}
``` 