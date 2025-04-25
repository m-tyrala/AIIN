# Plan implementacji widoku Formularza generacji profilu NPC

## 1. Przegląd
Widok generacji profilu NPC pozwala użytkownikowi wprowadzić minimalne dane (opis postaci, poziom skomplikowania, wybór istniejących profili) w celu wygenerowania wstępnego, edytowalnego profilu. Użytkownik może zaakceptować lub odrzucić wygenerowany profil.

## 2. Routing widoku
Ścieżka: `/generate`

## 3. Struktura komponentów
- **GenerateProfilePage**
  - GenerateProfileForm (formularz startowy)
  - LoaderOverlay (indykator ładowania)
  - ToastProvider (skomunikaty)

## 4. Szczegóły komponentów
### GenerateProfileForm
- Opis: Formularz do wprowadzenia `initial_prompt`, `complexity_level` i `existing_profile_ids`.
- Główne elementy:
  - `TextArea` dla `initial_prompt` (max 1000 znaków)
  - `Select` dla `complexity_level` (opcje: `uproszczony`, `zwykły`, `szczegółowy`)
  - `MultiSelect` dla `existing_profile_ids` (lista istniejących profili NPC)
  - Przycisk `Generuj`
  - Przycisk `Powrót` (nawigacja do `/`)
- Obsługiwane zdarzenia:
  - `onChange` dla każdego pola
  - `onSubmit` formularza → walidacja i wywołanie generacji przez hook
  - `onClick` `Powrót` → redirect `/`
- Warunki walidacji:
  - `initial_prompt`: wymagane, długość ≤ 1000 znaków
  - `complexity_level`: wymagane
- Typy:
  - `GenerateNpcProfileCommand`
- Propsy: brak (komponent lokalnie zarządza stanem)

## 5. Typy
- **GenerateNpcProfileCommand** (z `types.ts`):
  - `initial_prompt: string`
  - `complexity_level: ComplexityLevel`
  - `existing_profile_ids?: string[]`
- **GeneratedProfileViewModel** (nowy):
  - `name: string`
  - `appearance: string`
  - `profession: string`
  - `relationship_to_party: string`
  - `scene_description: string`
  - `special_traits: string`
  - `complexity_level: ComplexityLevel`
  - `existing_profile_ids?: string[]`
  - `is_public?: boolean`
- **CreateNpcProfileCommand** (z `types.ts`)

## 6. Zarządzanie stanem
- `useState` dla formularza generacji (`initialPrompt`, `complexityLevel`, `existingProfileIds`)
- `useState` dla `generatedProfile` (`GeneratedProfileViewModel | null`)
- `useState` dla flag ładowania (`isLoadingGenerate`, `isLoadingSave`)
- **useExistingNpcProfiles** hook – pobranie listy istniejących profili NPC
- **useGenerateNpcProfile** hook – wywołanie POST `/npc_profiles/generate`
- **useSaveNpcProfile** hook – wywołanie POST `/npc_profiles`

## 7. Integracja API
- **GET** `/npc_profiles` → lista `NpcProfileDTO` (do multi-select)
- **POST** `/npc_profiles/generate` (body: `GenerateNpcProfileCommand`) → `NpcProfileDTO` (wygenerowany profil)

## 8. Interakcje użytkownika
1. Wprowadzenie `initial_prompt`, wybór poziomu i ewentualnie `existing_profile_ids`.
2. Kliknięcie `Generuj` → pokazanie `LoaderOverlay`, wysłanie żądania.
3. Otrzymanie odpowiedzi → przekierowanie do widoku edycji profilu z przekazaniem danych wygenerowanego profilu.

## 9. Warunki i walidacja
- `initial_prompt` wymagany, długość ≤ 1000 znaków
- `complexity_level` wymagany

## 10. Obsługa błędów
- Błędy walidacji (400) → toast z detalami (3s)
- Przekroczenie limitu (429) → toast "Za dużo żądań", możliwość ponowienia
- Błędy sieciowe → toast "Wystąpił błąd sieciowy", opcja retry
- Błędy zapisu → toast szczegółowy i powrót do podglądu

## 11. Kroki implementacji
1. Utworzyć plik `/src/pages/generate.tsx` i skonfigurować routing w Astro.
2. Zainstalować/importować komponenty z Shadcn/UI: `TextArea`, `Select`, `MultiSelect`, `Button`, `Spinner`, `useToast`.
3. Zaimplementować `GenerateProfileForm` z walidacją inline i obsługą zdarzeń, która po otrzymaniu odpowiedzi przekierowuje do widoku edycji.
4. Napisać hook `useGenerateNpcProfile` (POST `/npc_profiles/generate`).
5. Dodać `LoaderOverlay` oraz `ToastProvider`.
6. Przetestować scenariusze generacji i przekierowania oraz poprawić ewentualne błędy. 