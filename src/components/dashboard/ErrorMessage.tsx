import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "Wystąpił błąd",
  message,
  onRetry,
  retryText = "Spróbuj ponownie",
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <div>
              <p className="font-medium text-destructive">{title}</p>
              <p className="text-sm text-destructive/80">{message}</p>
            </div>
            
            {onRetry && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  {retryText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 