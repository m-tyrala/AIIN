# API Endpoint Implementation Plan: Update NPC Profile

## 1. Przegląd punktu końcowego

Endpoint służy do aktualizacji istniejącego profilu NPC w systemie. Umożliwia częściową aktualizację profilu, gdzie użytkownik może zaktualizować tylko wybrane pola. Dostęp do aktualizacji mają tylko właściciel profilu oraz administratorzy systemu.

**Kluczowe funkcjonalności:**
- Częściowa aktualizacja profilu NPC
- Kontrola dostępu na poziomie właściciela/administratora
- Walidacja danych wejściowych
- Automatyczne logowanie operacji
- Aktualizacja timestamp `updated_at`

## 2. Szczegóły żądania

- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/npc_profiles/{id}`
- **Content-Type:** `application/json`

### Parametry:
- **Wymagane:**
  - `id` (UUID): Unikalny identyfikator profilu w URL
- **Opcjonalne (Request Body):**
  - `name` (string, max 100 znaków)
  - `appearance` (string, max 500 znaków)
  - `profession` (string, max 100 znaków)
  - `relationship_to_party` (string, max 500 znaków)
  - `scene_description` (string, max 500 znaków)
  - `special_traits` (string, max 150 znaków)
  - `complexity_level` (enum: "uproszczony" | "zwykły" | "szczegółowy")
  - `is_public` (boolean)

### Request Body Example:
```json
{
  "name": "Aktualizowane imię",
  "profession": "Nowy zawód",
  "complexity_level": "szczegółowy"
}
```

## 3. Wykorzystywane typy

### Istniejące typy z src/types.ts:
- **UpdateNpcProfileCommand**: `Partial<CreateNpcProfileCommand>` - dla request body
- **NpcProfileDTO**: kompletny obiekt profilu NPC dla response
- **ComplexityLevel**: enum dla poziomu skomplikowania
- **NpcProfileLogDTO**: dla logowania operacji

### Dodatkowe typy walidacyjne:
```typescript
// Zod schema dla walidacji UUID
const UuidSchema = z.string().uuid();

// Zod schema dla UpdateNpcProfileCommand
const UpdateNpcProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  appearance: z.string().min(1).max(500).optional(),
  profession: z.string().min(1).max(100).optional(),
  relationship_to_party: z.string().min(1).max(500).optional(),
  scene_description: z.string().min(1).max(500).optional(),
  special_traits: z.string().min(1).max(150).optional(),
  complexity_level: z.enum(["uproszczony", "zwykły", "szczegółowy"]).optional(),
  is_public: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Przynajmniej jedno pole musi być podane do aktualizacji"
});
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):
```json
{
  "id": "uuid",
  "name": "Nazwa NPC",
  "appearance": "Opis wyglądu",
  "profession": "Zawód",
  "relationship_to_party": "Relacja z grupą",
  "scene_description": "Opis sceny",
  "special_traits": "Specjalne cechy",
  "complexity_level": "szczegółowy",
  "is_public": false,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "user_id": "uuid"
}
```

### Błędy:
- **400 Bad Request**: Nieprawidłowe dane wejściowe
- **401 Unauthorized**: Brak autoryzacji
- **403 Forbidden**: Brak uprawnień do aktualizacji
- **404 Not Found**: Profil nie istnieje
- **500 Internal Server Error**: Błąd serwera

## 5. Przepływ danych

```
1. Odbieranie żądania PUT /api/npc_profiles/{id}
2. Walidacja UUID parametru id
3. Parsowanie i walidacja request body
4. Pobranie informacji o użytkowniku z context (Supabase Auth)
5. Sprawdzenie istnienia profilu NPC
6. Weryfikacja uprawnień (właściciel lub admin)
7. Aktualizacja profilu w bazie danych
8. Zapisanie logu operacji UPDATE
9. Zwrócenie zaktualizowanego profilu
```

### Interakcje z bazą danych:
1. **SELECT** - sprawdzenie istnienia profilu i uprawnień
2. **UPDATE** - aktualizacja profilu z `updated_at = NOW()`
3. **INSERT** - dodanie wpisu do tabeli `npc_profile_logs`

## 6. Względy bezpieczeństwa

### Autentykacja:
- Weryfikacja tokenu JWT poprzez Supabase Auth
- Użycie `context.locals.supabase` do sprawdzenia sesji użytkownika

### Autoryzacja:
- Sprawdzenie czy użytkownik jest właścicielem profilu (`user_id = current_user.id`)
- Alternatywnie sprawdzenie czy użytkownik ma rolę admin
- Implementacja guard clause na początku funkcji

### Walidacja danych:
- Walidacja UUID parametru `id`
- Walidacja wszystkich pól request body zgodnie z ograniczeniami bazy danych
- Sanityzacja danych wejściowych
- Sprawdzenie długości stringów

### Zapobieganie atakom:
- Wykorzystanie prepared statements przez Supabase SDK
- Rate limiting na poziomie middleware
- Walidacja Content-Type header

## 7. Obsługa błędów

### 400 Bad Request:
- Nieprawidłowy format UUID
- Błędy walidacji pól (za długie stringi, nieprawidłowy complexity_level)
- Pusty request body
- Nieprawidłowy Content-Type

### 401 Unauthorized:
- Brak tokenu autoryzacji
- Nieprawidłowy token
- Wygasły token

### 403 Forbidden:
- Użytkownik nie jest właścicielem profilu
- Użytkownik nie ma uprawnień administratora

### 404 Not Found:
- Profil o podanym ID nie istnieje

### 500 Internal Server Error:
- Błędy połączenia z bazą danych
- Inne nieoczekiwane błędy systemu

### Struktura odpowiedzi błędu:
```json
{
  "error": "Opis błędu",
  "details": "Szczegóły błędu (opcjonalne)",
  "code": "ERROR_CODE"
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje:
- Użycie pojedynczego zapytania UPDATE z WHERE clause
- Indeksowanie kolumny `id` (PRIMARY KEY - już indeksowane)
- Indeksowanie kolumny `user_id` dla szybkiego sprawdzenia uprawnień

### Potencjalne wąskie gardła:
- Sprawdzanie uprawnień użytkownika
- Logowanie operacji może zwiększać czas odpowiedzi

### Strategie:
- Użycie transakcji dla atomowości operacji
- Możliwość asynchronicznego logowania w przyszłości
- Caching informacji o uprawnieniach użytkownika

## 9. Etapy wdrożenia

### 1. Przygotowanie struktury plików
- Utworzenie pliku `/src/pages/api/npc_profiles/[id].ts`
- Dodanie schemas walidacyjnych do `/src/lib/schemas/`

### 2. Implementacja service layer
- Utworzenie `/src/lib/services/npcProfileService.ts`
- Implementacja funkcji `updateNpcProfile()`
- Implementacja funkcji `checkNpcProfilePermissions()`

### 3. Implementacja walidacji
- Utworzenie Zod schemas dla walidacji
- Implementacja walidacji UUID
- Implementacja walidacji request body

### 4. Implementacja endpointu API
- Implementacja funkcji `PUT` w `/src/pages/api/npc_profiles/[id].ts`
- Integracja z service layer
- Obsługa błędów i zwracanie odpowiedzi

### 5. Implementacja logowania
- Dodanie funkcji logowania do service
- Zapisywanie operacji UPDATE w tabeli logs

### Struktura plików do utworzenia:
```
src/
├── lib/
│   ├── schemas/
│   │   └── npcProfileSchemas.ts
│   └── services/
│       └── npcProfileService.ts
└── pages/
    └── api/
        └── npc_profiles/
            └── [id].ts
```

### Przykładowy kod implementacji:

#### `/src/lib/schemas/npcProfileSchemas.ts`
```typescript
import { z } from 'zod';

export const UuidSchema = z.string().uuid('Nieprawidłowy format UUID');

export const UpdateNpcProfileSchema = z.object({
  name: z.string().min(1, 'Nazwa nie może być pusta').max(100, 'Nazwa może mieć maksymalnie 100 znaków').optional(),
  appearance: z.string().min(1, 'Opis wyglądu nie może być pusty').max(500, 'Opis wyglądu może mieć maksymalnie 500 znaków').optional(),
  profession: z.string().min(1, 'Zawód nie może być pusty').max(100, 'Zawód może mieć maksymalnie 100 znaków').optional(),
  relationship_to_party: z.string().min(1, 'Relacja z grupą nie może być pusta').max(500, 'Relacja z grupą może mieć maksymalnie 500 znaków').optional(),
  scene_description: z.string().min(1, 'Opis sceny nie może być pusty').max(500, 'Opis sceny może mieć maksymalnie 500 znaków').optional(),
  special_traits: z.string().min(1, 'Specjalne cechy nie mogą być puste').max(150, 'Specjalne cechy mogą mieć maksymalnie 150 znaków').optional(),
  complexity_level: z.enum(['uproszczony', 'zwykły', 'szczegółowy'], {
    errorMap: () => ({ message: 'Poziom skomplikowania musi być jednym z: uproszczony, zwykły, szczegółowy' })
  }).optional(),
  is_public: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Przynajmniej jedno pole musi być podane do aktualizacji'
});
```

#### `/src/lib/services/npcProfileService.ts`
```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { UpdateNpcProfileCommand, NpcProfileDTO } from '../../types';

export class NpcProfileService {
  constructor(private supabase: SupabaseClient) {}

  async updateNpcProfile(id: string, userId: string, updateData: UpdateNpcProfileCommand): Promise<NpcProfileDTO> {
    // Sprawdzenie istnienia profilu i uprawnień
    const { data: existingProfile, error: fetchError } = await this.supabase
      .from('npc_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProfile) {
      throw new Error('Profile not found');
    }

    // Sprawdzenie uprawnień
    const { data: user } = await this.supabase.auth.getUser();
    const isOwner = existingProfile.user_id === userId;
    const isAdmin = user?.user?.user_metadata?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new Error('Insufficient permissions');
    }

    // Aktualizacja profilu
    const { data: updatedProfile, error: updateError } = await this.supabase
      .from('npc_profiles')
      .update({ 
        ...updateData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      throw new Error('Update failed');
    }

    // Logowanie operacji
    await this.logOperation(id, userId, 'UPDATE');

    return updatedProfile;
  }

  private async logOperation(npcProfileId: string, userId: string, operation: 'UPDATE') {
    const { data: user } = await this.supabase.auth.getUser();
    const userRole = user?.user?.user_metadata?.role === 'admin' ? 'admin' : 'user';

    await this.supabase
      .from('npc_profile_logs')
      .insert({
        npc_profile_id: npcProfileId,
        user_id: userId,
        user_role: userRole,
        operation,
        operation_timestamp: new Date().toISOString()
      });
  }
}
``` 