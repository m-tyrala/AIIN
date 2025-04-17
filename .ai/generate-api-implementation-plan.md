API Endpoint Implementation Plan: NPC Profile Generation Endpoint (/npc_profiles/generate)

## 1. Przegląd punktu końcowego
Endpoint ten umożliwia generowanie pełnego profilu NPC (Non-Playable Character) na podstawie minimalnych danych wejściowych za pomocą zewnętrznej usługi AI. Użytkownik otrzymuje podgląd wygenerowanego profilu, który może następnie edytować przed ostatecznym zapisaniem.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** /npc_profiles/generate
- **Parametry:**
  - **Wymagane:**
    - `initial_prompt` (string) – minimalny opis lub wskazówki dla AI
    - `complexity_level` (string) – poziom szczegółowości; dozwolone wartości: "uproszczony", "zwykły", "szczegółowy"
  - **Opcjonalne:**
    - `existing_profile_ids` (array of UUID) – lista identyfikatorów istniejących profili, które mogą być użyte przez AI przy generowaniu nowego profilu
- **Request Body Example:**
  ```json
  {
    "initial_prompt": "Opisz wygląd i charakter NPC",
    "complexity_level": "szczegółowy",
    "existing_profile_ids": ["uuid-1", "uuid-2"]
  }
  ```

## 3. Wykorzystywane typy
- **GenerateNpcProfileCommand:**
  - Zawiera: `initial_prompt`, `complexity_level`, `existing_profile_ids` (opcjonalnie)
- **NpcProfileDTO:**
  - Zawiera wszystkie pola profilu, takie jak: `id`, `name`, `appearance`, `profession`, `relationship_to_party`, `scene_description`, `special_traits`, `complexity_level`, `is_public`, `created_at`, `updated_at`, `user_id`

## 4. Szczegóły odpowiedzi
- **Struktura odpowiedzi:** Wygenerowany obiekt profilu NPC (preview) zawierający wszystkie wymagane pola.
- **Kody statusu:**
  - 200 OK – zwrócony gdy profil został wygenerowany synchronicznie
  - 202 Accepted – wynik asynchronicznego przetwarzania (jeśli generowanie trwa dłużej)

## 5. Przepływ danych
1. Klient wysyła żądanie POST na `/npc_profiles/generate` wraz z poprawnym JSON w ciele żądania.
2. Serwer waliduje dane wejściowe używając schematu Zod (czyli GenerateNpcProfileCommand).
3. Po walidacji, logika serwisowa (umieszczona w module `src/lib/services/aiService.ts`) przetwarza żądanie, wywołując zewnętrzną usługę AI do generowania profilu.
4. Otrzymany wynik jest mapowany do struktury zgodnej z `CreateNpcProfileCommand`.
5. Rejestrowanie operacji w tabeli `npc_profile_logs` z typem operacji 'GENERATE'.
6. Serwer zwraca wygenerowany profil jako podgląd użytkownikowi.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: Endpoint powinien być dostępny tylko dla zalogowanych użytkowników (np. poprzez Supabase auth).
- Walidacja danych: Stosowanie Zod do walidacji struktury żądania, by uniknąć niespodziewanych danych.
- Ograniczenie dostępu: Implementacja rate limiting, aby zapobiec nadużyciom (np. zwracanie 429 Too Many Requests).
- Ochrona sekretów: Klucze API dla zewnętrznej usługi AI powinny być przechowywane w zmiennych środowiskowych.

## 7. Obsługa błędów
- **400 Bad Request:** W przypadku nieprawidłowych danych wejściowych (np. brak wymaganych pól, niepoprawny format).
- **429 Too Many Requests:** W przypadku przekroczenia limitu żądań.
- **500 Internal Server Error:** W przypadku awarii po stronie serwera lub problemów z zewnętrzną usługą.
- Dodatkowo: Logowanie błędów (np. do systemu monitoringu lub zapisywanie w tabeli logów) w celu analizy i diagnostyki.

## 8. Rozważania dotyczące wydajności
- Asynchroniczne przetwarzanie: Jeśli generowanie profilu przez AI jest czasochłonne, rozważyć przetwarzanie asynchroniczne z użyciem statusu 202.
- Logowanie: Operacje logowania powinny być wykonywane asynchronicznie, aby nie blokować głównego przepływu.

## 9. Etapy wdrożenia
1. Utworzenie schematu walidacji Zod opierającego się na `GenerateNpcProfileCommand`.
2. Implementacja endpointa w `src/pages/api/npc_profiles/generate` z obsługą metody POST.
3. Implementacja modułu serwisowego w `src/lib/services/aiService.ts` do komunikacji z zewnętrzną usługą AI.
4. Integracja z zewnętrzną usługą AI – konfiguracja kluczy API i ustawień środowiskowych.
5. Dodanie logiki logowania operacji do tabeli `npc_profile_logs` przy operacji GENERATE.
6. Implementacja mechanizmu rate limiting oraz obsługi błędów zgodnie z ustalonymi kodami statusu.
7. Testowanie endpointa – jednostkowe i integracyjne testy w celu weryfikacji poprawności wdrożenia.