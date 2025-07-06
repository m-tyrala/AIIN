import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { navigate } from 'astro:transitions/client';
import { useAuth } from '@/hooks/useAuth';

interface ResetPasswordFormData {
  email: string;
}

interface ResetPasswordFormErrors {
  email?: string;
  general?: string;
}

const ResetPasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: ''
  });
  
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword, user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || '/';
      navigate(returnUrl);
    }
  }, [user, loading]);

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordFormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof ResetPasswordFormData, value: string) => {
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
      const result = await resetPassword(formData.email);
      
      if (result.success) {
        setEmailSent(true);
        toast.success('Link resetujący wysłany!', {
          duration: 5000,
          description: result.message || 'Sprawdź swoją skrzynkę email'
        });
      } else {
        setErrors({
          general: result.error || 'Wystąpił błąd podczas wysyłania linku'
        });
        
        toast.error('Błąd resetowania hasła', {
          duration: 3000,
          description: result.error || 'Sprawdź swoje dane i spróbuj ponownie'
        });
      }
    } catch (error) {
      setErrors({
        general: 'Wystąpił nieoczekiwany błąd podczas resetowania hasła'
      });
      
      toast.error('Błąd resetowania hasła', {
        duration: 3000,
        description: 'Sprawdź swoje dane i spróbuj ponownie'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    const loginUrl = returnUrl ? `/auth/login?returnUrl=${returnUrl}` : '/auth/login';
    navigate(loginUrl);
  };

  const handleRegisterClick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    const registerUrl = returnUrl ? `/auth/register?returnUrl=${returnUrl}` : '/auth/register';
    navigate(registerUrl);
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
            Resetowanie hasła
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Link resetujący został wysłany!
                </h3>
                <p className="text-sm text-green-700">
                  Sprawdź swoją skrzynkę email <strong>{formData.email}</strong> i kliknij w link, aby zresetować hasło.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleLoginClick}
                  className="w-full"
                  variant="outline"
                >
                  Powrót do logowania
                </Button>
                
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setFormData({ email: '' });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Wyślij ponownie
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła.
                </p>
              </div>
              
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
                  {isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetujący'}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Powrót do logowania
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Nie masz konta?{' '}
                    <button
                      type="button"
                      onClick={handleRegisterClick}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Zarejestruj się
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordForm; 