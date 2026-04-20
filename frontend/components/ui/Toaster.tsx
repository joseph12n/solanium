'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

/**
 * Toast — Notificaciones temporales que aparecen en la esquina.
 * Uso: importar addToast y llamar desde cualquier componente.
 */

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLOR_MAP = {
  success: 'border-neon-green/30 bg-neon-green/10',
  error: 'border-neon-red/30 bg-neon-red/10',
  info: 'border-accent-500/30 bg-accent-500/10',
};

const ICON_COLOR_MAP = {
  success: 'text-neon-green',
  error: 'text-neon-red',
  info: 'text-accent-400',
};

/* 
 * Sistema global de toasts — funciona sin contexto.
 * Subscribirse desde el componente <Toaster>, disparar con addToast().
 */
let toastId = 0;
type Listener = (toasts: Toast[]) => void;
let toasts: Toast[] = [];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function addToast(type: ToastType, message: string) {
  const id = ++toastId;
  toasts = [...toasts, { id, type, message }];
  notify();
  // Auto-remove después de 3.5s
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3500);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((fn) => fn !== setItems);
    };
  }, []);

  const removeToast = useCallback((id: number) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col-reverse gap-2 min-w-[320px]">
      <AnimatePresence>
        {items.map((toast) => {
          const Icon = ICON_MAP[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl ${COLOR_MAP[toast.type]}`}
            >
              <Icon size={18} className={ICON_COLOR_MAP[toast.type]} />
              <span className="flex-1 text-sm text-ink-100">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-ink-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
