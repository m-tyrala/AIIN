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

  useEffect(() => {
    // TODO: Implement Supabase auth integration
    // For now, simulate loading state
    const timer = setTimeout(() => {
      setLoading(false);
      // Mock user for development
      setUser({
        id: 'mock-user-id',
        email: 'user@example.com',
        role: 'user'
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      // TODO: Implement Supabase auth signOut
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas wylogowywania');
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      // TODO: Implement Supabase session check
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas sprawdzania sesji');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    logout,
    checkSession,
    isAuthenticated: !!user,
  };
}; 