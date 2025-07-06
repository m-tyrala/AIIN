import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { navigate } from 'astro:transitions/client';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || '/';
      navigate(returnUrl);
    }
  }, [user, loading]);

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Hasło musi mieć co najmniej 8 znaków';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Formularz zawiera błędy', {
        duration: 3000,
        description: 'Popraw błędy przed kontynuowaniem'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Logowanie pomyślne!', {
          duration: 3000,
          description: 'Przekierowujemy Cię do dashboardu'
        });
        
        // Redirect to previous page or dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl') || '/';
        navigate(returnUrl);
      } else {
        setErrors({
          general: result.error || 'Wystąpił błąd podczas logowania'
        });
        
        toast.error('Błąd logowania', {
          duration: 3000,
          description: result.error || 'Sprawdź swoje dane i spróbuj ponownie'
        });
      }
    } catch (error) {
      setErrors({
        general: 'Wystąpił nieoczekiwany błąd podczas logowania'
      });
      
      toast.error('Błąd logowania', {
        duration: 3000,
        description: 'Sprawdź swoje dane i spróbuj ponownie'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/auth/register');
  };

  const handleForgotPasswordClick = () => {
    navigate('/auth/reset-password');
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Sprawdzanie sesji...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Logowanie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="twoj@email.com"
                className={errors.email ? 'border-red-500' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Hasło
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Wprowadź hasło"
                className={errors.password ? 'border-red-500' : ''}
                disabled={isSubmitting}
                required
              />
              {errors.password && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {errors.general && (
              <div className="text-sm text-red-500 text-center" role="alert">
                {errors.general}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={isSubmitting}
              >
                Zapomniałeś hasła?
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Nie masz konta?{' '}
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                  disabled={isSubmitting}
                >
                  Zarejestruj się
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm; 