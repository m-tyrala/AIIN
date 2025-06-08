# OpenRouter Service Implementation Plan

## 1. Opis usługi
Usługa OpenRouter integruje się z interfejsem API OpenRouter, umożliwiając uzupełnienie czatów opartych na dużych modelach językowych (LLM). Dzięki integracji, usługa przetwarza komunikaty systemowe i użytkownika, a następnie zwraca ustrukturyzowane odpowiedzi zgodne z predefiniowanym schematem JSON. Usługa umożliwia konfigurację nazwy modelu oraz parametrów modelu, co pozwala na elastyczne dostosowanie do specyficznych wymagań aplikacji.

## 2. Opis konstruktora
Konstruktor usługi inicjalizuje kluczowe komponenty, takie jak: klient API, menedżer konfiguracji, moduły do formatowania żądań oraz obsługi odpowiedzi. Przyjmuje on parametry konfiguracyjne (API key, endpoint, domyślne parametry modelu i schemat odpowiedzi) oraz wykonuje wstępną walidację konfiguracji, zapewniając, że wszystkie niezbędne ustawienia są prawidłowo zdefiniowane.

## 3. Publiczne metody i pola
1. `sendChat(message: string): Promise<ChatResponse>`: Wysyła żądanie czatu do OpenRouter API, wykorzystując globalnie ustawione komunikaty systemowe (poprzez `systemPrompt`) oraz użytkownika (poprzez `userPrompt`), a także przekazany komunikat użytkownika.
2. `updateModelParameters(params: ModelParameters): void`: Aktualizuje konfigurację parametrów modelu, umożliwiając elastyczną zmianę ustawień bez restartu usługi.
3. `setSystemPrompt(prompt: string): void`: Ustawia globalny komunikat systemowy, który będzie używany przy formatowaniu żądań.
4. `setUserPrompt(prompt: string): void`: Ustawia globalny komunikat użytkownika, który będzie używany przy formatowaniu żądań.
5. `setResponseFormat(format: ResponseFormat): void`: Ustawia schemat odpowiedzi oparty o JSON schema. Przykładowy format:
   ```json
   { "type": "json_schema", "json_schema": { "name": "OpenRouterResponse", "strict": true, "schema": { "message": "string", "confidence": "number" } } }
   ```
6. Pola:
   - `apiClient`: Klient odpowiedzialny za komunikację z API OpenRouter.
   - `config`: Obiekt konfiguracji zawierający m.in. endpoint, API key oraz parametry modelu.
   - `systemPrompt`: Globalny komunikat systemowy, ustawiany przez metodę `setSystemPrompt`.
   - `userPrompt`: Globalny komunikat użytkownika, ustawiany przez metodę `setUserPrompt`.
   - `responseFormat`: Schemat JSON definiujący strukturę odpowiedzi, ustawiany przez metodę `setResponseFormat`.

## 4. Prywatne metody i pola
1. `_formatRequest(payload: ChatPayload): FormattedRequest`
   - Formatuje dane żądania, integrując:
     a. Komunikat systemowy (np. „System: Domyślny komunikat systemowy dla ustawienia roli”).
     b. Komunikat użytkownika (dynamicznie przekazywany).
     c. Ustrukturyzowane odpowiedzi, zdefiniowane przykładowym schematem:
     ```json
     { "type": "json_schema", "json_schema": { "name": "OpenRouterResponse", "strict": true, "schema": { "message": "string", "confidence": "number" } } }
     ```
     d. Nazwę modelu (np. „openrouter-gpt”).
     e. Parametry modelu (np. `{ "temperature": 0.7, "max_tokens": 150 }`).
2. `_handleResponse(response: any): ChatResponse`
   - Przetwarza i waliduje odpowiedź z API, mapując dane do odpowiedniego formatu i wykrywając ewentualne odchylenia od oczekiwanego schematu.
3. `_retryRequest(request: any): Promise<any>`
   - Implementuje mechanizm ponawiania żądania w przypadku wystąpienia błędów sieciowych lub innych problemów, stosując algorytm exponential backoff.

## 5. Obsługa błędów
Usługa przewiduje następujące scenariusze błędów:
1. Błąd sieciowy lub timeout – implementacja retry z algorytmem exponential backoff.
2. Nieprawidłowa konfiguracja (np. błędny API key lub endpoint) – wstępna walidacja i natychmiastowe zgłaszanie wyjątku.
3. Błąd walidacji odpowiedzi (response_format nie spełnia schematu JSON) – logowanie błędu i zwracanie spójnego komunikatu o błędzie.
4. Błąd podczas formatowania żądania – walidacja danych wejściowych i obsługa wyjątków.
5. Błędy serwera lub nieoczekiwane wyjątki – globalna obsługa błędów z mechanizmem logowania i alertowania.

## 6. Kwestie bezpieczeństwa
1. Przechowywanie API key i innych danych uwierzytelniających w bezpiecznych zmiennych środowiskowych.
2. Walidacja oraz sanityzacja wszystkich danych wejściowych przekazywanych do usługi.
4. Ograniczenie liczby ponownych prób żądania (rate limiting) w celu zapobiegania przeciążeniu lub atakom.
5. Implementacja logowania zdarzeń oraz monitorowanie potencjalnych nadużyć.

## 7. Plan wdrożenia krok po kroku
1. **Konfiguracja projektu:**
   - Ustalić i zdefiniować zmienne środowiskowe, takie jak API key, endpoint oraz domyślne parametry modelu.
   - Skonfigurować menedżera konfiguracji, korzystając z plików konfiguracyjnych lub zmiennych środowiskowych.

2. **Implementacja klienta API:**
   - Utworzyć klasę odpowiedzialną za komunikację z OpenRouter API przy użyciu wybranej biblioteki HTTP (np. Axios lub Fetch API).
   - Zaimplementować mechanizm ponawiania żądania przy wystąpieniu błędów sieciowych.

3. **Formatowanie żądań:**
   - Opracować funkcję `_formatRequest`, która zapewni strukturę żądania zawierającą:
     a. Komunikat systemowy (przykładowo: „System: Domyślny komunikat systemowy dla ustawienia roli”).
     b. Komunikat użytkownika (dynamiczny input od użytkownika).
     c. Ustrukturyzowany response_format z przykładowym schematem:
        ```json
        { "type": "json_schema", "json_schema": { "name": "OpenRouterResponse", "strict": true, "schema": { "message": "string", "confidence": "number" } } }
        ```
     d. Nazwę modelu (np. „openrouter-gpt”).
     e. Parametry modelu (np. `{ "temperature": 0.7, "max_tokens": 150 }`).

4. **Implementacja obsługi odpowiedzi:**
   - Zaimplementować metodę `_handleResponse` odpowiedzialną za walidację i ekstrakcję danych z odpowiedzi API.
   - Przygotować scenariusze walidacyjne i mechanizmy wykrywania błędów w strukturze odpowiedzi.

5. **Obsługa błędów:**
   - Dodać mechanizmy try/catch oraz retry w przypadku niepowodzenia żądania.
   - Zapewnić walidację zarówno danych wejściowych, jak i odpowiedzi API oraz wdrożyć spójny system logowania błędów.
   - Testować scenariusze błędów: timeout, niewłaściwy format odpowiedzi, błędna konfiguracja.