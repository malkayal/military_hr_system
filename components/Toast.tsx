
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const TOAST_DURATION = 4000;

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; progressColor: string }> = {
  success: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-emerald-500',
    icon: <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />,
    progressColor: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-red-500',
    icon: <XCircle size={20} className="text-red-500 shrink-0" />,
    progressColor: 'bg-red-500',
  },
  warning: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-amber-500',
    icon: <AlertTriangle size={20} className="text-amber-500 shrink-0" />,
    progressColor: 'bg-amber-500',
  },
  info: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-blue-500',
    icon: <Info size={20} className="text-blue-500 shrink-0" />,
    progressColor: 'bg-blue-500',
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const style = TOAST_STYLES[toast.type];
  const [width, setWidth] = React.useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    const step = 100 / (TOAST_DURATION / 50);
    intervalRef.current = setInterval(() => {
      setWidth(prev => {
        if (prev <= 0) {
          clearInterval(intervalRef.current!);
          onRemove(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative w-80 rounded-2xl border-r-4 shadow-xl overflow-hidden ${style.bg} ${style.border}`}
      dir="rtl"
    >
      <div className="flex items-start gap-3 p-4">
        {style.icon}
        <p className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-none ${style.progressColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 left-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
