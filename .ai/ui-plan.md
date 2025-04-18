# Architektura UI dla RPG Asystent

## 1. Przegląd struktury UI

System składa się z pięciu głównych widoków:
- Ekran rejestracji
- Ekran logowania
- Dashboard NPC
- Formularz generacji profilu
- Formularz edycji profilu

Struktura UI opiera się na routingu za pomocą ścieżek, animowanych przejściach (styl obracania kostki) oraz centralnym loaderze przy operacjach asynchronicznych. Interfejs jest zaprojektowany zgodnie z zasadami responsywności, dostępności (wsparcie klawiatury, ciemny motyw, wysoki kontrast) oraz bezpieczeństwa (integracja Google OAuth, JWT).

## 2. Lista widoków

**Ekran rejestracji**
- Ścieżka: `/register`
- Główny cel: Rejestracja użytkownika za pomocą Google OAuth.
- Kluczowe informacje: Formularz rejestracji, komunikaty błędów (toast notifications) wyświetlane przez 3 sekundy.
- Kluczowe komponenty: Przycisk rejestracji Google, loader, system obsługi JWT.
- Uwagi UX, dostępność, bezpieczeństwo: Prostota, wsparcie dla czytników ekranu, wysokokontrastowy design, bezpieczne przekazywanie tokenów.

**Ekran logowania**
- Ścieżka: `/login`
- Główny cel: Autoryzacja użytkownika za pomocą Google OAuth.
- Kluczowe informacje: Formularz logowania, komunikaty błędów (toast notifications) wyświetlane przez 3 sekundy.
- Kluczowe komponenty: Przycisk logowania Google, loader, system obsługi JWT.
- Uwagi UX, dostępność, bezpieczeństwo: Prostota, wsparcie dla czytników ekranu, wysokokontrastowy design, bezpieczne przekazywanie tokenów.

**Dashboard NPC**
- Ścieżka: `/`
- Główny cel: Wyświetlanie listy profili NPC z możliwością filtrowania, sortowania i wyszukiwania.
- Kluczowe informacje: Lista profili, filtry (checkbox "public"), sortowanie po nazwie i dacie edycji, pole wyszukiwania.
- Kluczowe komponenty: Tabela/lista NPC, checkbox, input wyszukiwania, kontrolki sortowania, przycisk do utworzenia nowego NPC, przycisk wylogowania.
- Uwagi UX, dostępność, bezpieczeństwo: Responsywność, wsparcie nawigacji klawiaturą, szybkie przejście do formularza edycji, zabezpieczenie dostępu i dynamiczne odświeżanie danych bez cache.

**Formularz generacji profilu**
- Ścieżka: `/generate`
- Główny cel: Wygenerowanie nowego profilu NPC na podstawie minimalnych danych.
- Kluczowe informacje: Pole tekstowe na opis, wybór poziomu skomplikowania (uproszczony, zwykły, szczegółowy), selectlist wielokrotnego wyboru istniejących NPC, komunikaty błędów (toast notifications) wyświetlane przez 3 sekundy.
- Kluczowe komponenty: Formularz, walidacja inline, loader przy operacjach asynchronicznych, integracja z API do generowania profilu, przycisk powrotu do dashboardu.
- Uwagi UX, dostępność, bezpieczeństwo: Intuicyjny układ, inline walidacja błędów, czytelne komunikaty błędów, łatwo dostępne elementy sterujące.

**Formularz edycji profilu**
- Ścieżka: `/{npc-id}` (lub `/new` dla nowego profilu)
- Główny cel: Edycja szczegółów profilu NPC przed zapisem.
- Kluczowe informacje: Wyświetlenie wszystkich parametrów profilu (imię, wygląd, zawód, opis stosunku do bohaterów, opis sytuacji spotkania, cechy szczególne, parametr public) z możliwością edycji.
- Kluczowe komponenty: Formularz edycyjny, przyciski "Akceptuj" i "Anuluj", walidacja inline, toast notifications dla błędów i komunikatów API wyświetlane przez 3 sekundy.
- Uwagi UX, dostępność, bezpieczeństwo: Intuicyjna edycja, natychmiastowa walidacja, responsywność formularza, zarządzanie stanem przez React Context, dynamiczne pobieranie danych z API.

## 3. Mapa podróży użytkownika

1. Użytkownik rozpoczyna sesję na ekranie logowania (`/login`) bądź rejestracji (`/register`). Po pomyślnej autoryzacji następuje przekierowanie.
2. Po logowaniu (`/login`) użytkownik trafia na dashboard (`/`) gdzie użytkownik przegląda listę NPC, korzysta z filtrów (checkbox "public"), sortowania (nazwa, data edycji) oraz wyszukiwarki. Przycisk wyloguj kieruje na stronę logowania.
3. Klikając na istniejący profil użytkownik przechodzi do formularza edycji profilu (`/{npc-id}`).
4. Wybierając przycisk "Nowy NPC" użytkownik przechodzi do formularza generacji profilu (`/generate`) 
5. Po rejestracji (`/register`) użytkownik również trafia na widok generacji profilu (`/generate`)
6. W formularzu generacji użytkownik wprowadza minimalne dane, wybiera poziom skomplikowania i opcjonalnie dołącza istniejące profile, po czym system pokazuje loader podczas tworzenia profilu. Przet zatwierdzeniem generacji użytkownik może przyciskiem wrócić do dashboardu.
6. Po wygenerowaniu, użytkownik trafia do formularza edycji (`/{npc-id}`), gdzie ma możliwość modyfikacji szczegółów profilu. Po zatwierdzeniu zmian profil zostaje zapisany w bazie danych. Po tym fakcie, bądź anulowaniu, wracamy do Dashboardu.
7. W przypadku błędów, użytkownik widzi komunikaty inline lub toast notifications, umożliwiające korektę danych.

## 4. Układ i struktura nawigacji

- Nawigacja oparta jest na ścieżkach: `/register`, `/login`, `/`, `/generate` oraz `/{npc-id}`.
- Użytkownik przechodzi między widokami przy użyciu przycisków i interaktywnych elementów (np. lista NPC, przycisk generacji nowego profilu, przycisk wyloguj, przycisk powrotu do dashboardu).
- Animowane przejścia w stylu obracania kostki sześciennej zwiększają płynność nawigacji.
- Header zawiera nazwę aplikacji oraz przycisk wylogowania.

## 5. Kluczowe komponenty

- Komponent autentykacji z integracją Google OAuth i zarządzaniem tokenami JWT.
- React Context do zarządzania stanem użytkownika bez cache.
- Komponenty formularzy z walidacją inline oraz obsługą toast notifications dla błędów API.
- Tabela lub lista NPC z funkcjami filtrowania, sortowania i wyszukiwania.
- Loader/spinner do wizualizacji operacji asynchronicznych.
- Komponenty do animacji przejść między widokami (efekt obracania kostki).
- Komponenty responsywne i dostępne (obsługa klawiatury, wsparcie dla czytników ekranu, ciemny motyw o wysokim kontraście). 