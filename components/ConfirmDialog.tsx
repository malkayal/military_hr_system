
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = (): ConfirmContextValue => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx;
};

const VARIANT_STYLES: Record<ConfirmVariant, {
  iconBg: string;
  icon: React.ReactNode;
  confirmBtn: string;
  titleColor: string;
}> = {
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    icon: <ShieldAlert size={28} className="text-red-600 dark:text-red-400" />,
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
    titleColor: 'text-red-700 dark:text-red-400',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: <AlertTriangle size={28} className="text-amber-600 dark:text-amber-400" />,
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: <Info size={28} className="text-blue-600 dark:text-blue-400" />,
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20',
    titleColor: 'text-blue-700 dark:text-blue-400',
  },
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  const variant = state?.variant ?? 'info';
  const styles = VARIANT_STYLES[variant];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
              dir="rtl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${styles.iconBg}`}>
                    {styles.icon}
                  </div>
                  <button
                    onClick={() => handleClose(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className={`text-xl font-black ${styles.titleColor}`}>{state.title}</h3>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{state.message}</p>
                </div>
              </div>

              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {state.cancelText ?? 'إلغاء'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`flex-1 py-3 px-6 font-black rounded-2xl transition-all hover:scale-105 active:scale-95 ${styles.confirmBtn}`}
                >
                  {state.confirmText ?? 'تأكيد'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
