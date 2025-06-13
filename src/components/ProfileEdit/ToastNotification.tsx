import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { ToastProps } from '@/types/profile-edit';

export const ToastNotification: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div 
      className={`
        w-full max-w-sm sm:max-w-md mx-4 sm:mx-0
        rounded-lg border p-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        ${getBackgroundColor()}
        animate-in slide-in-from-top-2 fade-in-0
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className={`flex-1 text-sm font-medium ${getTextColor()}`}>
          {message}
        </div>
        
        <button
          type="button"
          onClick={onClose}
          className={`
            flex-shrink-0 p-1 rounded-full hover:bg-black/10 
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${getTextColor()}
          `}
          aria-label="Zamknij powiadomienie"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {autoClose && (
        <div className="mt-2">
          <div 
            className={`h-1 bg-current opacity-30 rounded-full overflow-hidden`}
          >
            <div 
              className="h-full bg-current animate-pulse"
              style={{ 
                animation: `shrink ${duration}ms linear forwards` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// CSS animation dla progress bar
const styles = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

// Dodaj style do head (w prawdziwej aplikacji to byłoby w CSS)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
} 