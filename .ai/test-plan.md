## <plan_testów>

### 1) Wprowadzenie i cele testowania
- **Cel główny**: Zapewnienie jakości aplikacji AIIN (Astro + React + TS + Supabase) poprzez wczesne wykrywanie regresji, błędów funkcjonalnych, problemów wydajnościowych i ryzyk bezpieczeństwa.
- **Cele szczegółowe**:
  - Zweryfikować krytyczne przepływy: autentykacja, generowanie profilu NPC (AI), CRUD profili, filtrowanie/sortowanie/paginacja na dashboardzie.
  - Zapewnić poprawność walidacji po stronie klienta i API (Zod).
  - Potwierdzić egzekwowanie uprawnień i ograniczeń (public/private, właściciel, rate limiting).
  - Zweryfikować odporność UI (stany: loading, error, empty) oraz dostępność (a11y).

### 2) Zakres testów
- **Frontend (Astro/React/TS)**:
  - Komponenty: `src/components/**` (auth, dashboard, profile-edit, ui).
  - Hooki: `src/hooks/**` (auth, dashboard, profile-edit, debounce).
  - Walidacje: `src/lib/schemas/**`.
  - Konteksty/toasty, ErrorBoundary, nawigacja/redirecty.
- **Backend (Astro API routes)**:
  - `src/pages/api/auth/**`
  - `src/pages/api/npc_profiles.ts` i `src/pages/api/npc_profiles/[id].ts`
  - `src/pages/api/npc_profiles/generate.ts`
  - Middleware: `src/middleware/index.ts`
  - Serwisy: `src/lib/services/**` (AI, NPC profile, log).
  - Utils: `src/lib/utils/**`
- **Integracje**:
  - Supabase (DB + auth + polityki widoczności).
  - OpenRouter (AI) – w testach izolowane przez mocki/kontrakty.

Poza zakresem: dogłębne testy stylów (Tailwind), testy wdrożeniowe infrastruktury poza CICD (z wyjątkiem smoke i Lighthouse CI).

### 3) Typy testów do przeprowadzenia
- **Analiza statyczna**: TypeScript (noImplicitAny, strict), ESLint, formatowanie (Prettier).
- **Testy jednostkowe (Vitest)**:
  - Schematy Zod: dashboard, npc-generation, npc-profile.
  - Utilsy: `api-response.util.ts`, `auth.util.ts`, `utils.ts`.
  - Hooki: `useDebounce`, walidacje i stany `useProfileEdit`, `useDashboard` (z MSW).
  - Serwisy: logika mapowania i reguł w `npc-profile.service.ts` (mock Supabase).
- **Testy komponentów (RTL + Vitest)**:
  - Formularze auth i profile-edit (walidacja, stany, disabled, toasty).
  - Dashboard (SearchInput z debounce, PublicProfileFilter, SortSelector, PaginationControls).
  - Karty profili (akcje owner-only).
  - ErrorBoundary i stany ładowania/błędu.
- **Testy integracyjne (API + serwisy)**:
  - API routes z MSW lub uruchomionym lokalnie Supabase (preferowane: MSW + kontrakt na zapytania).
  - `middleware/index.ts` (rate limits).
  - `aiService.ts` – kontrakt request/response, retry, rate-limit, obsługa statusów 4xx/5xx.
- **E2E (Playwright)**:
  - Rejestracja/logowanie/wylogowanie/reset hasła (cookies, redirect `returnUrl`).
  - Generowanie profilu (sukces/401/400/429), przejście do `/new`, wypełnienie i zapis.
  - Dashboard: filtr, sort, paginacja, puste/z błędem/ładowanie; edycja/usuwanie właściciela.
  - Uprawnienia: dostęp do profilów public/private i cudzych zasobów.
- **Dostępność (axe + Playwright)**: kluczowe widoki (index, login, dashboard, edycja profilu).
- **Wydajność i obciążenie**:
  - K6/Artillery: listowanie profili (paginacja/sort/search), generowanie (limit RPS, 95. percentyl).
  - Lighthouse CI: LCP, TTI dla stron publicznych (index, dashboard).
- **Bezpieczeństwo (podstawowe)**:
  - Egzekwowanie uprawnień w API i serwisach.
  - Rate limiting (middleware).
  - Niewyciekanie sekretów i błędów (sanityzacja, kody statusów).
- **Regresja wizualna (opcjonalnie)**: Playwright Screenshots na kluczowe widoki.

### 4) Scenariusze testowe dla kluczowych funkcjonalności
- Autentykacja (Auth)
  - Rejestracja: poprawna/duble email/niezgodne hasła/za krótkie hasło.
  - Logowanie: poprawne/niepoprawne dane; redirect `returnUrl` z zachowaniem query string; stany toastów.
  - Wylogowanie: czyszczenie sesji, redirect na `/`.
  - Reset hasła: walidacja email, sukces/400/500, stany UI `emailSent`.
  - Hook `useAuth`: inicjalizacja, stany `loading`, obsługa błędów i rezultatów.
- Dashboard (Lista profili)
  - SearchInput: debounce 500 ms, walidacja Zod, czyszczenie (`Esc`/X).
  - PublicProfileFilter: anonim → tylko public; zalogowany → togglowanie `undefined`/`false`.
  - SortSelector: pełna lista opcji, walidacja, fallback na domyślne.
  - Paginacja: poprawny tekst zakresu, klawisze ← →, zmiana limitu.
  - NpcGrid/NpcCard: właściciel widzi akcje edycji/usuwania; potwierdzenie usunięcia; stany pusty/błąd/ładowanie.
  - `useDashboard`: inicjalne pobranie, zmiana filtrów, błędy API, usuwanie z odświeżeniem.
- Generowanie profilu (AI)
  - Walidacja formularza (max 1000 znaków, wymagane pole).
  - Wywołanie `/api/npc_profiles/generate`: 200 → zapis w `sessionStorage` `generatedNpcProfile` i redirect `/new`; 400 → komunikat; 401 → komunikat/logowanie; 429 → retry hint z toastem; 5xx → fallback błąd.
  - `LoaderOverlay`: poprawne pokrycie UI w trakcie generowania.
  - MultiSelect istniejących profili: pobranie listy (100, sort name asc), stany pusty/ładowanie/błąd.
- Edycja i zapis profilu
  - `ProfileEditForm`: walidacje pól, `ComplexitySelect`, `PublicToggle`, stany `isDirty/isValid`, przyciski akcji aktywne/pasywne.
  - Tworzenie nowego profilu z danych z `sessionStorage` (prefill).
  - Edycja istniejącego profilu: uprawnienia tylko właściciel.
  - Obsługa błędów API: walidacyjne, permission denied, 404, 500.
- API i serwisy
  - `npc_profiles.ts` (GET): paginacja, sort, search, widoczność (anon → public; zalogowany → własne private + public).
  - `npc_profiles/[id].ts` (GET/PUT/DELETE): uprawnienia właściciela, brak dostępu do cudzego private, poprawne kody statusów.
  - `npc-profile.service.ts`: mapowanie DTO, walidacja uprawnień, logowanie operacji (create/update/delete/open).
  - `middleware/index.ts`: progi rate limit per operacja; blokada i komunikat po przekroczeniu.
  - `aiService.ts`: format requestu, nagłówki, obsługa limitów, sanityzacja promptów, zgodność ze schematem odpowiedzi.
- Odporność i błędy
  - ErrorBoundary: render fallback, szczegóły tylko w dev, akcje Spróbuj ponownie/Strona główna.
  - ToastContext: limit toasts, autoClose, ręczne zamykanie.

### 5) Środowisko testowe
- **Runtime**: Node LTS (>=18), Windows runner zgodny z dev (możliwość matrix: Ubuntu w CI).
- **Konfiguracja**:
  - `dotenv`/sekrety w CI: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY` (w testach AI → stub/MSW).
  - Supabase: lokalny (Docker) lub testowy projekt; migracje z `supabase/migrations/**`.
  - Build/test runner: Vite + Vitest; Playwright (Chrome, Firefox, WebKit).
  - `msw` do stubowania żądań HTTP (AI i API, gdy testy jednostkowe/integracyjne wymagają izolacji).
- **Dane testowe**:
  - Seed minimalny: 1 użytkownik, 5 publicznych profili, 3 prywatne (różni właściciele), zróżnicowane daty, nazwy, poziomy złożoności.
  - Skrypty seed/cleanup uruchamiane przed/po zestawie testów integracyjnych/E2E.
- **Tryby**:
  - Jednostkowe/integracyjne: w pamięci/mocked; bez realnych sieci (MSW).
  - E2E: przeciwko dev serwerowi z lokalną bazą i mockiem AI (scenariusze negatywne i pozytywne).

### 6) Narzędzia do testowania
- Testy i mocki: Vitest, React Testing Library, MSW.
- E2E i a11y: Playwright (+ @axe-core/playwright).
- Wydajność: K6 lub Artillery; Lighthouse CI dla stron publicznych.
- Analiza statyczna: TypeScript, ESLint, Prettier.
- Raportowanie: JUnit/HTML reporters (Vitest/Playwright), Code Coverage (c8/istanbul).
- CI/CD: GitHub Actions (matryce OS/Node, równoległość, artefakty raportów).

### 7) Harmonogram testów
- Tydzień 1:
  - Ustanowienie fundamentów: konfiguracja Vitest/RTL/MSW/Playwright, szablony danych, pipeline CI, raporty.
  - Testy jednostkowe schematów i utilsów (80% pokrycia tych modułów).
- Tydzień 2:
  - Testy komponentów (auth, dashboard, profile-edit) i hooków (`useDashboard`, `useProfileEdit`, `useAuth`).
  - Testy integracyjne API (mock Supabase), middleware rate limiting, kontrakt `aiService`.
- Tydzień 3:
  - E2E krytycznych przepływów (auth, generowanie, CRUD, dashboard).
  - A11y (axe) i Lighthouse CI (Pages: index, dashboard).
- Tydzień 4:
  - Wydajność (K6/Artillery), testy bezpieczeństwa (uprawnienia, rate limit, ujawnienie błędów).
  - Stabilizacja, flake-retry, zamknięcie luk pokrycia krytycznych ścieżek.
- Ciągłe:
  - Regresja/PR checks, smoke E2E nightly, monitorowanie metryk.

### 8) Kryteria akceptacji testów
- Analiza statyczna: 0 błędów lintera; kompilacja TS bez błędów.
- Pokrycie (minimalne, na krytycznych modułach):
  - Utils/schematy/serwisy: linie ≥ 85%, gałęzie ≥ 75%.
  - Hooki/komponenty kluczowe: linie ≥ 80%, gałęzie ≥ 70%.
- E2E: 100% scenariuszy krytycznych zielone (auth, generacja, CRUD, dashboard).
- A11y: brak krytycznych błędów axe na stronach kluczowych.
- Wydajność:
  - API listowania: P95 < 400 ms przy RPS 20 (lokalny benchmark).
  - Generowanie: poprawna obsługa 429, brak degradacji UI.
- Bezpieczeństwo:
  - Brak nieautoryzowanych dostępów do prywatnych profili.
  - Rate limit skuteczny (blokada i komunikat).
- Brak regresji wizualnych (jeśli włączone screenshoty) w widokach krytycznych.

### 9) Role i odpowiedzialności
- QA Lead:
  - Projekt strategii, priorytety, przegląd planu i raportów, koordynacja regresji.
- QA Engineer:
  - Implementacja testów E2E/wydajności/a11y, tworzenie danych testowych.
- Developerzy:
  - Testy jednostkowe/hooków/komponentów, utrzymanie pokrycia, naprawa regresji.
- DevOps:
  - CI/CD, sekrety, artefakty raportów, utrzymanie środowisk testowych.
- Product Owner:
  - Akceptacja kryteriów, priorytetyzacja poprawek, decyzje go/no-go.

### 10) Procedury raportowania błędów
- Zgłoszenia w GitHub Issues z szablonem:
  - Tytuł, opis, kroki reprodukcji, oczekiwany vs rzeczywisty wynik, zrzuty ekranu/logi, środowisko (commit, OS, przeglądarka), severity (Blocker/Critical/Major/Minor), komponent (frontend/backend/API/AI).
- Triage dzienny (QA Lead + Dev + PO):
  - Priorytety, przypisania, SLA naprawy wg severity.
- Linkowanie do raportów testów (Vitest/Playwright) i trace’ów (Playwright Trace Viewer).
- Zamknięcie błędu po:
  - Naprawa + test pokrywający + zielone pipeline’y + weryfikacja QA.

### Załączniki (implementacja testów – skrócony mapping)
- Jednostkowe:
  - `lib/schemas/*.ts` – testy pozytywne/negatywne.
  - `lib/utils/*.ts` – formaty odpowiedzi, token extraction, permission helper.
  - `lib/services/npc-profile.service.ts` – mapowania, uprawnienia, logowanie operacji.
  - `lib/services/aiService.ts` – format requestu, obsługa błędów, rate-limit (mock czasu).
- Komponentowe (RTL):
  - `components/auth/*Form.tsx`, `dashboard/*`, `ProfileEdit/*`, `ErrorBoundary.tsx`.
- Integracyjne:
  - `pages/api/**` z MSW; middleware z parametryzowanymi limitami.
- E2E (Playwright):
  - `specs/auth.spec.ts`, `specs/generate.spec.ts`, `specs/dashboard.spec.ts`, `specs/profile-crud.spec.ts`.
- A11y:
  - `axe` na `index`, `login`, `dashboard`, `/:id` (edycja/nowy).
- Wydajność:
  - K6/Artillery skrypty na listowanie i generowanie; Lighthouse CI workflow.