import { useState, useEffect } from 'react';
import type { User } from '../types';

/**
 * Custom hook for authentication management
 * @returns Object with user state and auth methods
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from server-side or localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have user data from server-side rendering
        const serverUser = (window as any).__ASTRO_USER__;
        if (serverUser) {
          setUser(serverUser);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Błąd inicjalizacji autoryzacji');
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Błąd logowania');
      }

      if (result.success && result.data?.user) {
        setUser({
          id: result.data.user.id,
          email: result.data.user.email,
          role: 'user'
        });
        setLoading(false);
        return { success: true };
      }

      throw new Error('Nieprawidłowa odpowiedź serwera');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd logowania';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, password: string, confirmPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Błąd rejestracji');
      }

      if (result.success && result.data?.user) {
        setUser({
          id: result.data.user.id,
          email: result.data.user.email,
          role: 'user'
        });
        setLoading(false);
        return { success: true };
      }

      throw new Error('Nieprawidłowa odpowiedź serwera');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd rejestracji';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Błąd wylogowania');
      }

      setUser(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd wylogowania';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Błąd resetowania hasła');
      }

      setLoading(false);
      return { success: true, message: result.message };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd resetowania hasła';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  };
}; 