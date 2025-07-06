import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { navigate } from 'astro:transitions/client';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/auth/login'
}) => {
  // TODO: Implementacja prawdziwego sprawdzania autentykacji
  // Na razie zwracamy fallback lub redirect
  const isAuthenticated = false; // Tymczasowo ustawione na false
  const isLoading = false; // Tymczasowo ustawione na false

  const handleLoginClick = () => {
    navigate(redirectTo);
  };

  const handleRegisterClick = () => {
    navigate('/auth/register');
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Sprawdzanie autoryzacji...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-yellow-600 text-6xl">
                🔒
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Wymagane logowanie
              </h2>
              <p className="text-gray-600">
                Aby uzyskać dostęp do tej strony, musisz się zalogować.
              </p>
              <div className="space-y-2 pt-4">
                <Button 
                  onClick={handleLoginClick}
                  className="w-full"
                >
                  Zaloguj się
                </Button>
                <Button 
                  onClick={handleRegisterClick}
                  variant="outline"
                  className="w-full"
                >
                  Zarejestruj się
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard; 