# Specyfikacja Techniczna Modułu Autentykacji AIIN

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Struktura Stron i Komponentów

#### Nowe Strony Astro (SSR)
- **`/src/pages/auth/login.astro`** - Strona logowania
- **`/src/pages/auth/register.astro`** - Strona rejestracji  
- **`/src/pages/auth/reset-password.astro`** - Strona resetowania hasła

#### Nowe Komponenty React Client-Side
- **`/src/components/auth/LoginForm.tsx`** - Interaktywny formularz logowania
- **`/src/components/auth/RegisterForm.tsx`** - Interaktywny formularz rejestracji
- **`/src/components/auth/ResetPasswordForm.tsx`** - Formularz resetowania hasła
- **`/src/components/auth/AuthGuard.tsx`** - Komponent ochrony tras
- **`/src/components/auth/AuthButtons.tsx`** - Przyciski logowania/wylogowania dla headera

#### Rozszerzenia Istniejących Komponentów
- **`/src/layouts/Layout.astro`** - Dodanie AuthButtons w headerze (prawy górny róg)
- **`/src/components/dashboard/DashboardPage.tsx`** - Integracja z prawdziwą autentykacją
- **`/src/hooks/useAuth.ts`** - Implementacja prawdziwej logiki Supabase Auth

### 1.2 Odpowiedzialność Komponentów

#### Strony Astro (Server-Side)
- **Walidacja** wstępnych parametrów URL (tokeny, redirecty)
- **Renderowanie** layoutu i embedding komponentów React
- **Obsługa** server-side redirectów po autentykacji
- **Sprawdzanie** sesji przy pierwszym załadowaniu strony

#### Komponenty React (Client-Side)
- **Zarządzanie** stanem formularzy i walidacją
- **Komunikacja** z API endpoints
- **Obsługa** błędów i loading states
- **Interakcje** użytkownika (submit, navigation)

### 1.3 Obsługa Walidacji i Błędów

#### Walidacja Client-Side
```typescript
// Schemat walidacji dla formularzy auth
interface AuthFormValidation {
  email: string; // Format email, wymagane
  password: string; // Min 8 znaków, wymagane
  confirmPassword?: string; // Musi pasować do password (tylko rejestracja)
}

// Podstawowe komunikaty błędów
interface AuthErrorMessages {
  'auth/user-not-found': 'Użytkownik nie został znaleziony';
  'auth/wrong-password': 'Nieprawidłowe hasło';
  'auth/email-already-in-use': 'Email jest już używany';
  'auth/weak-password': 'Hasło jest za słabe';
  'auth/invalid-email': 'Nieprawidłowy format email';
}
```

#### Scenariusze Błędów
- **Błędy walidacji** - wyświetlane pod polami formularza
- **Błędy sieciowe** - toast notification z opcją ponowienia
- **Błędy autoryzacji** - redirect na stronę logowania

### 1.4 Główne Scenariusze UX

#### Scenariusz Logowania
1. Użytkownik wchodzi na chronioną stronę → redirect na `/auth/login`
2. Wypełnia formularz (email, hasło) → walidacja client-side
3. Submit → loader → komunikat wyniku
4. Sukces → redirect na poprzednią stronę lub dashboard (root `/`)
5. Błąd → komunikat + możliwość ponowienia

#### Scenariusz Rejestracji
1. Link "Zarejestruj się" → `/auth/register`
2. Formularz z email, hasło, potwierdź hasło
3. Submit → rejestracja w Supabase
4. Sukces → automatyczne logowanie i redirect na dashboard (root `/`)
5. Błąd → komunikat + możliwość ponowienia

#### Scenariusz Resetowania Hasła
1. Link "Zapomniałeś hasła?" → `/auth/reset-password`
2. Formularz z email
3. Submit → wysłanie linku resetującego
4. Komunikat o wysłaniu linku
5. Kliknięcie linku → możliwość ustawienia nowego hasła

## 2. LOGIKA BACKENDOWA

### 2.1 Struktura Endpointów API

#### Nowe Endpointy Auth
- **`POST /api/auth/login`** - Logowanie użytkownika
- **`POST /api/auth/register`** - Rejestracja użytkownika  
- **`POST /api/auth/logout`** - Wylogowanie użytkownika
- **`POST /api/auth/reset-password`** - Żądanie resetowania hasła

#### Struktura Odpowiedzi API
```typescript
interface AuthApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface LoginResponse {
  user: User;
  session: Session;
}
```

### 2.2 Mechanizm Walidacji

#### Walidacja Żądań
```typescript
// Schema walidacji za pomocą zod
const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków')
});

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword']
});
```

#### Walidacja Autoryzacji
- **Middleware** sprawdza sesje Supabase dla API endpoints
- **Server-side** weryfikacja sesji dla stron Astro
- **Client-side** AuthGuard dla komponentów React

### 2.3 Obsługa Wyjątków

#### Podstawowa Obsługa Błędów
```typescript
class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

// Strategia obsługi błędów:
// - API endpoints zwracają strukturalne błędy JSON
// - Server-side redirect z error query params
// - Client-side toast notifications i field errors
```

### 2.4 Aktualizacja Renderowania Server-Side

#### Modyfikacja Middleware
```typescript
// Rozszerzenie src/middleware/index.ts
export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client
  context.locals.supabase = supabaseClient;
  
  // Get user session for protected routes
  const { data: { session } } = await supabaseClient.auth.getSession();
  context.locals.user = session?.user || null;
  
  // Protect routes that require authentication (all except /auth/* and root /)
  const publicRoutes = ['/auth/', '/'];
  const isPublicRoute = publicRoutes.some(route => 
    context.url.pathname === '/' || context.url.pathname.startsWith('/auth/')
  );
  
  if (!isPublicRoute && !context.locals.user) {
    return Response.redirect(new URL('/auth/login', context.url.origin));
  }
  
  // Continue with existing API rate limiting logic...
});
```

#### Rozszerzenie Typu Locals
```typescript
// src/env.d.ts
declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
  }
}
```

## 3. SYSTEM AUTENTYKACJI

### 3.1 Integracja z Supabase Auth

#### Konfiguracja Supabase Client
```typescript
// src/db/supabase.client.ts - rozszerzenie istniejącego pliku
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!
);
```

#### Obsługa Sesji w Astro
```typescript
// src/lib/auth/session.ts
export class AstroAuthSession {
  static async getUser(request: Request): Promise<User | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    return user;
  }
  
  static async requireAuth(request: Request): Promise<User> {
    const user = await this.getUser(request);
    if (!user) {
      throw new AuthError('unauthorized', 'Wymagana autoryzacja');
    }
    return user;
  }
}
```

### 3.2 Ochrona Tras

#### AuthGuard Component
```typescript
// src/components/auth/AuthGuard.tsx
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/auth/login'
}) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    if (fallback) return <>{fallback}</>;
    window.location.href = redirectTo;
    return null;
  }
  
  return <>{children}</>;
};
```

### 3.3 Obsługa Stanów Autentykacji

#### Rozszerzenie useAuth Hook
```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    
    initAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
    
    setUser(data.user);
    setLoading(false);
    return { success: true };
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
    
    setUser(data.user);
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
    
    setLoading(false);
    return { success: true };
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user
  };
};
```

## 4. BEZPIECZEŃSTWO

### 4.1 Walidacja i Sanityzacja
- **Wszystkie inputy** walidowane przez zod schemas
- **SQL injection protection** poprzez Supabase ORM
- **XSS protection** poprzez React automatic escaping

### 4.2 Sesje i Cookies
- **Domyślne zarządzanie sesjami** przez Supabase
- **Automatyczne wygaśnięcie** sesji zgodnie z konfiguracją Supabase

## 5. INTEGRACJA Z ISTNIEJĄCĄ APLIKACJĄ

### 5.1 Zachowanie Kompatybilności
- **Istniejące API endpoints** zachowują obecną strukturę
- **Dashboard komponenty** rozszerzane o prawdziwą autentykację
- **Middleware** rozszerzany o ochronę tras
- **Typy TypeScript** rozszerzane o typy auth

### 5.2 Aktualizacja Istniejących Komponentów
- **Layout.astro** - dodanie AuthButtons w prawym górnym rogu
- **DashboardPage.tsx** - ochrona przez AuthGuard
- **Wszystkie chronione strony** - weryfikacja sesji w middleware

### 5.3 Testowanie
- **Unit tests** dla auth utilities i hooks
- **Integration tests** dla API endpoints
- **E2E tests** dla flow logowania/rejestracji
- **Manual testing** wszystkich scenariuszy z US-004

## 6. WDROŻENIE

### 6.1 Etapy Implementacji
1. **Etap 1**: Komponenty auth i strony (login, register, reset-password)
2. **Etap 2**: API endpoints i walidacja
3. **Etap 3**: Integracja z middleware i ochrona tras
4. **Etap 4**: Aktualizacja Layout.astro i istniejących komponentów
5. **Etap 5**: Testy i deployment

### 6.2 Konfiguracja Środowiska
```bash
# Wymagane zmienne środowiskowe
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 6.3 Walidacja Zgodności z PRD
- ✅ **Dedykowane strony** logowania i rejestracji
- ✅ **Wymagane pola**: email, hasło, potwierdzenie hasła
- ✅ **Ochrona tras**: brak dostępu bez logowania
- ✅ **Przyciski w headerze**: prawy górny róg Layout.astro
- ✅ **Brak zewnętrznych serwisów**: tylko Supabase email/password
- ✅ **Odzyskiwanie hasła**: reset-password endpoint i strona
- ✅ **Realizacja wszystkich User Stories**: US-001 do US-005

Specyfikacja została uproszczona do minimalnych wymagań z PRD przy zachowaniu pełnej funkcjonalności wymaganej w US-004. 