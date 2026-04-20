'use client';

import { cn } from '@/lib/utils';

/**
 * Ticker — Cinta informativa con scroll horizontal infinito.
 * Ideal para mostrar métricas rápidas del negocio o mensajes.
 */
interface TickerProps {
  items: Array<{ label: string; value: string; color?: string }>;
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

const SPEED_MAP = {
  slow: '35s',
  normal: '25s',
  fast: '15s',
};

export function Ticker({ items, className, speed = 'normal' }: TickerProps) {
  // Duplicamos los items para scroll infinito seamless
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        'relative overflow-hidden py-2.5 border-y border-white/5',
        className
      )}
    >
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `ticker ${SPEED_MAP[speed]} linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-xs">
            <span
              className="w-1.5 h-1.5 rounded-full animate-glow-pulse"
              style={{ backgroundColor: item.color || '#7c5cff' }}
            />
            <span className="text-ink-500 uppercase tracking-wider">{item.label}</span>
            <span className="text-ink-200 font-semibold font-mono">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
