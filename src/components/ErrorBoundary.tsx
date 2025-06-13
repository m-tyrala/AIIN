import React from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Wywołaj callback jeśli został podany
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Logowanie błędu
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Użyj custom fallback jeśli został podany
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Domyślny UI błędu
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ups! Wystąpił błąd</CardTitle>
              <CardDescription>
                Przepraszamy, ale coś poszło nie tak. Aplikacja napotkała nieoczekiwany problem.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Szczegóły błędu (tylko w development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-3 rounded-md text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground">
                    Szczegóły błędu (development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Błąd:</strong> {this.state.error.name}
                    </div>
                    <div>
                      <strong>Wiadomość:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack trace:</strong>
                        <pre className="text-xs overflow-auto max-h-32 mt-1 bg-background p-2 rounded border">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Akcje */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Spróbuj ponownie
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Strona główna
                </Button>
              </div>

              {/* Dodatkowe wskazówki */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Jeśli problem się powtarza, spróbuj odświeżyć stronę lub skontaktuj się z obsługą.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Funkcjonalny wrapper dla łatwiejszego użycia
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  showToast?: (message: string, type: 'error') => void;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  fallback,
  showToast
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Wyświetl toast jeśli funkcja została podana
    if (showToast) {
      showToast(
        'Wystąpił nieoczekiwany błąd. Sprawdź konsolę po więcej szczegółów.',
        'error'
      );
    }

    // Dodatkowe logowanie lub raportowanie błędów
    console.group('🚨 Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  };

  return (
    <ErrorBoundary onError={handleError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}; 