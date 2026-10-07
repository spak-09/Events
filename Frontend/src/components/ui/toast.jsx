import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-elevated bg-card text-card-foreground',
                isSuccess && 'border-emerald-500/30 bg-emerald-500/5',
                isError && 'border-destructive/30 bg-destructive/5',
                isWarning && 'border-amber-500/30 bg-amber-500/5',
                !isSuccess && !isError && !isWarning && 'border-border'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {isError && <AlertCircle className="h-4 w-4 text-destructive" />}
                {isWarning && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 text-xs">
                {toast.title && <div className="font-semibold text-foreground">{toast.title}</div>}
                {toast.description && (
                  <div className="text-muted-foreground mt-0.5 leading-relaxed">{toast.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
