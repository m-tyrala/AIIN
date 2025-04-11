# Aplikacja - RPG Asystent (MVP)

## Główny problem
Mistrz gry w papierowych grach RPG spędza dużo czasu na tworzeniu i zarządzaniu profilami postaci niezależnych (NPC), co może opóźniać rozpoczęcie rozgrywki oraz wprowadzać chaos w organizacji sesji. Brak dedykowanego narzędzia do szybkiego generowania spójnych i szczegółowych profili NPC utrudnia pracę i ogranicza możliwości twórcze podczas sesji.

## Najmniejszy zestaw funkcjonalności
- **Generowanie profili NPC**: Użytkownik wprowadza opis postaci, który jest przesyłany do modelu LLM, generującego dane profilu postaci w ustalonej strukturze.
- **Operacje CRUD**: Możliwość tworzenia, edytowania, usuwania i przeglądania profili NPC.
- **Logowanie i uwierzytelnianie**: Implementacja mechanizmu logowania opartego na koncie Google, gwarantująca bezpieczny dostęp do aplikacji oraz indywidualną obsługę użytkowników.

## Co NIE wchodzi w zakres MVP
- Zaawansowane opcje konfiguracji i personalizacji generowanych profili (np. szczegółowe statystyki, modyfikacja atrybutów poza podstawowymi danymi).
- Rozbudowane funkcjonalności analityczne lub raportujące dla zarządzania kampanią.
- Integracja z innymi systemami lub platformami zewnętrznymi służącymi do zarządzania sesjami RPG.
- Funkcje administracyjne, takie jak zarządzanie uprawnieniami wielu użytkowników czy zaawansowane ustawienia konta.

## Kryteria sukcesu
- Co najmniej 75% wygenerowanych profili NPC jest akceptowanych przez użytkownika bez potrzeby manualnych poprawek.
- Średni czas generowania profilu NPC wynosi poniżej 10 sekund, co zapewnia płynność i efektywność w trakcie sesji.
