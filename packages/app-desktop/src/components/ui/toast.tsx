import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap: Record<ToastType, string> = {
  success: 'border-[var(--color-success)]/30 bg-[var(--color-success)]/8 text-[var(--color-success)]',
  error: 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 text-[var(--color-danger)]',
  warning: 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/8 text-[var(--color-warning)]',
  info: 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 text-[var(--color-primary)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
          {toasts.map((t) => {
            const Icon = iconMap[t.type];
            return (
              <div
                key={t.id}
                className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-md)] border shadow-[var(--shadow-md)] bg-[var(--color-surface)] ${styleMap[t.type]} animate-[slideIn_200ms_ease-out]`}
              >
                <Icon size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm-causa flex-1">{t.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-0.5 shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
