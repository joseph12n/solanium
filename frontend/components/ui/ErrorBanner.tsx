'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

/**
 * ErrorBanner — Banner dismissible para errores de carga de datos.
 * Reemplaza los estados vacíos confusos cuando en realidad hay un error de API.
 *
 * Uso:
 *   <ErrorBanner error={error} onRetry={load} onDismiss={() => setError(null)} />
 */
interface Props {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 rounded-xl px-4 py-3 flex items-start gap-3"
          style={{
            background: 'rgb(var(--danger) / 0.08)',
            border: '1px solid rgb(var(--danger) / 0.25)',
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: 'rgb(var(--danger))' }}
            className="mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: 'rgb(var(--danger))' }}
            >
              {error}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                title="Reintentar"
                className="p-1.5 rounded-md transition"
                style={{ color: 'rgb(var(--danger))' }}
              >
                <RefreshCw size={13} />
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                title="Cerrar"
                className="p-1.5 rounded-md transition"
                style={{ color: 'rgb(var(--danger))' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
