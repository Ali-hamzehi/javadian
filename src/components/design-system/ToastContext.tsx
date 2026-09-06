import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastTone } from '../../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (
    titleOrObj: string | { id?: string; title: string; description?: string; tone?: ToastTone; duration?: number },
    options?: { description?: string; tone?: ToastTone; duration?: number }
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      titleOrObj: string | { id?: string; title: string; description?: string; tone?: ToastTone; duration?: number },
      options?: { description?: string; tone?: ToastTone; duration?: number }
    ) => {
      let finalTitle = '';
      let finalDesc: string | undefined;
      let finalTone: ToastTone = 'info';
      let finalDuration = 4000;
      let finalId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (typeof titleOrObj === 'object') {
        finalTitle = titleOrObj.title;
        finalDesc = titleOrObj.description;
        finalTone = titleOrObj.tone || 'info';
        finalDuration = titleOrObj.duration || 4000;
        if (titleOrObj.id) finalId = titleOrObj.id;
      } else {
        finalTitle = titleOrObj;
        finalDesc = options?.description;
        finalTone = options?.tone || 'info';
        finalDuration = options?.duration || 4000;
      }

      const newToast: ToastMessage = {
        id: finalId,
        title: finalTitle,
        description: finalDesc,
        tone: finalTone,
        duration: finalDuration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(finalId);
        }, newToast.duration);
      }
    },
    [removeToast]
  );

  const getToneStyles = (tone: ToastTone) => {
    switch (tone) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        };
      case 'danger':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-950',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-950',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-primary-50 border-primary-300 text-primary-950',
          icon: <Info className="w-5 h-5 text-primary-700 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Floating toast notifications container */}
      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const styles = getToneStyles(t.tone);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 transform transition-all animate-in slide-in-from-bottom-5 duration-200 ${styles.bg}`}
            >
              <div className="flex items-start gap-3">
                {styles.icon}
                <div>
                  <h5 className="text-xs font-bold leading-tight">{t.title}</h5>
                  {t.description && (
                    <p className="mt-1 text-xs opacity-85 leading-relaxed">{t.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-60 hover:opacity-100 p-0.5 rounded cursor-pointer transition-opacity"
               aria-label="بستن">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
