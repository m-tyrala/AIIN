# Dokument wymagań produktu (PRD) - AIIN

## 1. Przegląd produktu
Aplikacja "RPG Asystent" została zaprojektowana z myślą o wsparciu mistrzów gier RPG w szybkim i efektywnym tworzeniu oraz zarządzaniu profilami NPC. Aplikacja umożliwia generowanie szczegółowych opisów postaci na podstawie minimalnych danych wejściowych, co przyspiesza przygotowanie do sesji i poprawia organizację rozgrywki.

## 2. Problem użytkownika
Mistrzowie gier RPG często tracą dużo czasu na ręczne przygotowanie profili NPC, co wydłuża przygotowania d sesji, opóźnia akcję na sesji i może powodować chaos organizacyjny. Brak dedykowanego narzędzia do szybkiego tworzenia spójnych opisów postaci skutkuje niską efektywnością oraz ogranicza możliwości twórcze podczas rozgrywki.

## 3. Wymagania funkcjonalne
- Generowanie profilu NPC: Formularz umożliwia wprowadzenie opisu postaci oraz wybór poziomu szczegółowości (uproszczony – domyślny, zwykły, szczegółowy). Profil NPC powinien składać się z:
  - Imienia i nazwiska lub pseudonimu.
  - Wyglądu: opis wyglądu postaci w 2 zdaniach dla poziomu "zwykły" lub 4 zdaniach dla poziomu "szczegółowy".
  - Zajęcia lub zawodu (1-3 słowa).
  - Opisu stosunku do bohaterów graczy.
  - Opisu sytuacji, w której drużyna spotyka postać, w 2-4 zdaniach (dla poziomu szczegółowego).
  - Cech szczególnych w 1 zdaniu.
- Integracja istniejących profili: Formularz zawiera select listę wielokrotnego wyboru, pozwalającą na dodanie już istniejących profili NPC do promptu.
- Zarządzanie profilami (CRUD): Aplikacja udostępnia dedykowany widok do tworzenia, edytowania, usuwania oraz przeglądania profili NPC.
- Logowanie: System uwierzytelniania oparty na koncie Google, wykorzystujący domyślne metody rekomendowane przez Google, zapewniający bezpieczny dostęp do aplikacji.
- Backend: Aplikacja działa na customowym serwerze VPS, korzystającym z bazy danych PostgreSQL oraz prostego interfejsu API.
- Monitorowanie efektywności: System rejestruje wskaźniki edycji oraz ponownych otwarć profili, służące do oceny sprawności modelu generującego opisy.

## 4. Granice produktu
- Brak zaawansowanej konfiguracji i personalizacji profili NPC poza podstawowymi danymi.
- Brak integracji z zewnętrznymi systemami do zarządzania sesjami RPG.
- Nie obejmuje funkcji administracyjnych związanych z zarządzaniem uprawnieniami wielu użytkowników.

## 5. Historyjki użytkowników

- ID: US-001
  Tytuł: Tworzenie profilu NPC
  Opis: Jako mistrz gry chcę szybko stworzyć nowy profil NPC, aby rozpocząć sesję bez zbędnych opóźnień.
  Kryteria akceptacji:
    - Formularz generowania profilu NPC składa się z: jednego pola tekstowego (maksymalnie 1000 znaków) do wprowadzenia opisu postaci, selectlisty wyboru poziomu skomplikowania (uproszczony – domyślny, zwykły, szczegółowy) oraz selectlisty umożliwiającej dołączenie istniejących profili NPC.
    - Po wprowadzeniu danych system przekazuje opis do modelu generującego profil.
    - Po wygenerowaniu profilu, użytkownik otrzymuje formularz wyświetlający każdy parametr profilu (imię i nazwisko lub pseudonim, wygląd, zajęcie/ zawód, opis stosunku do bohaterów, opis sytuacji spotkania, cechy szczególne), w którym każdy parametr można edytować.
    - Użytkownik decyduje, czy profil zostanie zapisany w bazie, wybierając przyciski Akceptuj lub Odrzuć.
    - Generacja profilu trwa poniżej 10 sekund.

- ID: US-002
  Tytuł: Zarządzanie profilami NPC
  Opis: Jako użytkownik chcę mieć dedykowany widok do zarządzania profilami NPC, aby móc przeglądać, edytować i usuwać istniejące profile.
  Kryteria akceptacji:
    - Widok umożliwia wykonywanie operacji CRUD (tworzenie, edycja, usuwanie, przeglądanie).
    - Interfejs umożliwia szybkie wyszukanie konkretnego profilu.

- ID: US-003
  Tytuł: Integracja istniejących NPC do promptu
  Opis: Jako użytkownik chcę mieć możliwość dodawania istniejących profili NPC do promptu za pomocą select listy wielokrotnego wyboru, aby wzbogacić generowany opis.
  Kryteria akceptacji:
    - Formularz zawiera element select listy umożliwiający wielokrotny wybór profili NPC.
    - Wybrane profile są poprawnie integrowane w prompt do generowania nowego opisu.

- ID: US-004
  Tytuł: Bezpieczne logowanie przez Google
  Opis: Jako użytkownik chcę bezpiecznie logować się przy użyciu konta Google, aby moje dane były chronione i dostęp do aplikacji był zabezpieczony.
  Kryteria akceptacji:
    - System logowania wykorzystuje domyślne metody uwierzytelniania rekomendowane przez Google.
    - Uwierzytelnianie działa poprawnie na wszystkich etapach korzystania z aplikacji.

- ID: US-005
  Tytuł: Monitorowanie efektywności generowania profili
  Opis: Jako administrator chcę rejestrować wskaźniki dotyczące edycji i ponownych otwarć profili NPC, aby ocenić efektywność modelu generującego opisy postaci.
  Kryteria akceptacji:
    - System rejestruje minimalne dane operacyjne związane z edycjami i otwarciami profili.
    - Dane te mogą być wygenerowane w postaci raportu do analizy efektywności rozwiązania.

## 6. Metryki sukcesu
- Co najmniej 75% generowanych profili zostaje zaakceptowanych przez użytkowników bez potrzeby manualnych poprawek.
- Średni czas generowania profilu wynosi poniżej 10 sekund.
- Wskaźniki edycji i ponownych otwarć są systematycznie monitorowane jako miara efektywności działania modelu.
- Pozytywne opinie użytkowników dotyczące usprawnienia pracy i organizacji sesji RPG. 