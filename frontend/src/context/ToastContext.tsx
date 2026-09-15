import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'warning' | 'info' | 'replan';

interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const icon = {
              success: <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              info: <Info className="w-5 h-5 text-yellow-400 shrink-0" />,
              replan: <Zap className="w-5 h-5 text-yellow-400 shrink-0 animate-pulse" />
            }[t.type];

            const borderClass = {
              success: 'border-yellow-500/40 bg-[#0d0d10]/95 text-yellow-50 shadow-yellow-500/10',
              warning: 'border-amber-500/40 bg-[#0d0d10]/95 text-amber-50 shadow-amber-500/10',
              info: 'border-yellow-500/30 bg-[#0d0d10]/95 text-yellow-50 shadow-yellow-500/10',
              replan: 'border-yellow-400/50 bg-[#0d0d10]/95 text-yellow-50 shadow-yellow-400/20'
            }[t.type];

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start justify-between gap-3 ${borderClass}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{icon}</div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold tracking-wide text-white">{t.message}</p>
                    {t.description && (
                      <p className="text-[11px] text-slate-300 leading-snug">{t.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-white p-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
