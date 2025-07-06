import React from 'react';
import { Button } from '@/components/ui/button';
import { navigate } from 'astro:transitions/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const AuthButtons: React.FC = () => {
  const { user, loading, logout } = useAuth();

  const handleLoginClick = () => {
    // Save current path as return URL
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = encodeURIComponent(currentPath);
    navigate(`/auth/login?returnUrl=${returnUrl}`);
  };

  const handleRegisterClick = () => {
    // Save current path as return URL
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = encodeURIComponent(currentPath);
    navigate(`/auth/register?returnUrl=${returnUrl}`);
  };

  const handleLogoutClick = async () => {
    try {
      const result = await logout();
      if (result.success) {
        toast.success('Wylogowano pomyślnie!', {
          duration: 3000,
          description: 'Do zobaczenia!'
        });
        // Redirect to home page after logout
        navigate('/');
      } else {
        toast.error('Błąd wylogowania', {
          duration: 3000,
          description: 'Spróbuj ponownie'
        });
      }
    } catch (error) {
      toast.error('Błąd wylogowania', {
        duration: 3000,
        description: 'Wystąpił nieoczekiwany błąd'
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-gray-600">Sprawdzanie...</span>
      </div>
    );
  }

  // Show buttons based on auth state
  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 hidden sm:inline">
          Witaj, {user.email}
        </span>
        <Button
          onClick={handleLogoutClick}
          variant="outline"
          size="sm"
        >
          Wyloguj
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={handleLoginClick}
        variant="outline"
        size="sm"
      >
        Zaloguj
      </Button>
      <Button
        onClick={handleRegisterClick}
        size="sm"
      >
        Zarejestruj
      </Button>
    </div>
  );
};

export default AuthButtons; 