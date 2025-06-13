import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ToastNotification } from '@/components/ProfileEdit/ToastNotification';
import type { ToastProps } from '@/types/profile-edit';

interface Toast {
  id: string;
  message: string;
  type: ToastProps['type'];
  autoClose?: boolean;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastProps['type'], options?: Partial<Pick<Toast, 'autoClose' | 'duration'>>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastProps['type'], 
    options: Partial<Pick<Toast, 'autoClose' | 'duration'>> = {}
  ) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      message,
      type,
      autoClose: options.autoClose ?? true,
      duration: options.duration ?? 3000
    };

    setToasts(prev => {
      // Ograniczenie liczby toastów
      const updated = [...prev, newToast];
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });
  }, [generateId, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Kontener dla wszystkich toastów */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-full">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 8}px)`,
              zIndex: 1000 - index
            }}
          >
            <ToastNotification
              message={toast.message}
              type={toast.type}
              onClose={() => hideToast(toast.id)}
              autoClose={toast.autoClose}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook dla używania toast contextu
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

// Convenience hooks dla różnych typów toastów
export const useToastActions = () => {
  const { showToast } = useToast();
  
  return {
    showSuccess: useCallback((message: string, options?: Partial<Pick<Toast, 'autoClose' | 'duration'>>) => 
      showToast(message, 'success', options), [showToast]),
    
    showError: useCallback((message: string, options?: Partial<Pick<Toast, 'autoClose' | 'duration'>>) => 
      showToast(message, 'error', { autoClose: false, ...options }), [showToast]),
    
    showWarning: useCallback((message: string, options?: Partial<Pick<Toast, 'autoClose' | 'duration'>>) => 
      showToast(message, 'warning', options), [showToast]),
    
    showInfo: useCallback((message: string, options?: Partial<Pick<Toast, 'autoClose' | 'duration'>>) => 
      showToast(message, 'info', options), [showToast])
  };
}; 