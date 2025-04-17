# Schemat bazy danych - AIIN

## 1. Tabele

### a. Typ ENUM dla poziomu skomplikowania

```sql
CREATE TYPE complexity_level AS ENUM ('uproszczony', 'zwykły', 'szczegółowy');
```

### b. Tabela: npc_profiles

**Kolumny:**
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID NOT NULL
- `name`: VARCHAR(100) NOT NULL
- `appearance`: VARCHAR(500) NOT NULL
- `profession`: VARCHAR(100) NOT NULL
- `relationship_to_party`: VARCHAR(500) NOT NULL
- `scene_description`: VARCHAR(500) NOT NULL
- `special_traits`: VARCHAR(150) NOT NULL
- `complexity_level`: complexity_level NOT NULL
- `is_public`: BOOLEAN NOT NULL DEFAULT false
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Klucz obcy:**
- FOREIGN KEY (`user_id`) REFERENCES users(id)

### c. Typ ENUM dla operacji logów

```sql
CREATE TYPE log_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'GENERATE', 'OPEN');
```

### d. Tabela: npc_profile_logs

**Kolumny:**
- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `npc_profile_id`: UUID NOT NULL
- `user_id`: UUID NOT NULL
- `user_role`: VARCHAR(20) NOT NULL CHECK (user_role IN ('admin', 'user'))
- `operation`: log_operation NOT NULL
- `operation_timestamp`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `duration`: INTERVAL

**Klucz obcy:**
- FOREIGN KEY (`npc_profile_id`) REFERENCES npc_profiles(id)
- FOREIGN KEY (`user_id`) REFERENCES users(id)

## 2. Relacje między tabelami

- Relacja 1:n między tabelą `users` (zewnętrzna tabela Supabase) a `npc_profiles`
- Relacja 1:n między `npc_profiles` a `npc_profile_logs`
- Relacja 1:n między `users` a `npc_profile_logs`

## 3. Indeksy

- Indeks na `npc_profiles.user_id`
- Indeks na `npc_profile_logs.npc_profile_id` oraz `npc_profile_logs.user_id`

## 4. Zasady PostgreSQL (RLS)

Na tabeli `npc_profiles` włączamy RLS i definiujemy polityki:

```sql
ALTER TABLE npc_profiles ENABLE ROW LEVEL SECURITY;

-- Polityka odczytu: dostęp gdy profil jest publiczny, lub użytkownik jest właścicielem, lub ma rolę admina
CREATE POLICY select_npc_profiles ON npc_profiles
    FOR SELECT
    USING (is_public = true OR user_id = current_setting('jwt.claims.user_id')::uuid OR current_setting('jwt.claims.role') = 'admin');

-- Polityka modyfikacji (UPDATE, DELETE): tylko właściciel lub admin
CREATE POLICY modify_npc_profiles ON npc_profiles
    FOR UPDATE, DELETE
    USING (user_id = current_setting('jwt.claims.user_id')::uuid OR current_setting('jwt.claims.role') = 'admin');
```

## 5. Widok Agregujący Metryki

Widok `npc_profile_metrics` agreguje liczbę edycji (UPDATE) i otwarć (OPEN) z rozróżnieniem operacji wykonanych przez właściciela profilu oraz przez innych użytkowników. Operacje wykonane przez admina są pomijane.

```sql
CREATE VIEW npc_profile_metrics AS
SELECT
    l.npc_profile_id,
    COUNT(*) FILTER (WHERE l.operation = 'UPDATE' AND l.user_role <> 'admin' AND l.user_id = p.user_id) AS owner_edit_count,
    COUNT(*) FILTER (WHERE l.operation = 'UPDATE' AND l.user_role <> 'admin' AND l.user_id <> p.user_id) AS other_edit_count,
    COUNT(*) FILTER (WHERE l.operation = 'OPEN' AND l.user_role <> 'admin' AND l.user_id = p.user_id) AS owner_open_count,
    COUNT(*) FILTER (WHERE l.operation = 'OPEN' AND l.user_role <> 'admin' AND l.user_id <> p.user_id) AS other_open_count
FROM npc_profile_logs l
JOIN npc_profiles p ON l.npc_profile_id = p.id
GROUP BY l.npc_profile_id, p.user_id;
```

## 6. Widok: Średni czas akcji GENERATE według poziomu złożoności

```sql
CREATE VIEW npc_generate_avg_duration_by_complexity AS
SELECT
    p.complexity_level,
    AVG(l.duration) AS average_generate_duration
FROM npc_profile_logs l
JOIN npc_profiles p ON l.npc_profile_id = p.id
WHERE l.operation = 'GENERATE'
GROUP BY p.complexity_level;
```

## 7. Dodatkowe Uwagi

- Ograniczenia długości pól są egzekwowane poprzez definicje VARCHAR z określonym limitem znaków.
- Użycie typów ENUM (`complexity_level`, `log_operation`) gwarantuje poprawność wartości.
- RLS zapewnia, że edycja profilu może być dokonywana wyłącznie przez właściciela lub administratora, natomiast publiczny odczyt jest możliwy, gdy `is_public` = true.
- Schemat jest zoptymalizowany pod kątem Supabase z możliwością przyszłych migracji.
