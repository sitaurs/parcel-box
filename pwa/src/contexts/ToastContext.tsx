import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'], duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl shadow-2xl backdrop-blur-md border animate-slide-in-right ${
            toast.type === 'success'
              ? 'bg-green-500/90 border-green-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-500/90 border-red-600 text-white'
              : toast.type === 'warning'
              ? 'bg-yellow-500/90 border-yellow-600 text-white'
              : 'bg-blue-500/90 border-blue-600 text-white'
          }`}
        >
          <div className="flex items-center justify-between space-x-3">
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
