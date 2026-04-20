'use client';

import { motion } from 'framer-motion';
import CountUp from '@/components/reactbits/CountUp';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  formatter?: (v: number) => string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  accent?: 'violet' | 'cyan' | 'green' | 'orange';
}

const ACCENT_MAP = {
  violet: {
    bg: 'bg-accent-500/10',
    icon: 'text-accent-light',
    shadow: 'shadow-glow-sm',
    dot: 'bg-accent-500',
  },
  cyan: {
    bg: 'bg-neon-cyan/10',
    icon: 'text-neon-cyan',
    shadow: 'shadow-glow-cyan',
    dot: 'bg-neon-cyan',
  },
  green: {
    bg: 'bg-neon-green/10',
    icon: 'text-neon-green',
    shadow: 'shadow-glow-green',
    dot: 'bg-neon-green',
  },
  orange: {
    bg: 'bg-neon-orange/10',
    icon: 'text-neon-orange',
    shadow: 'shadow-glow-orange',
    dot: 'bg-neon-orange',
  },
};

/**
 * StatCard — Double-Bezel con CountUp animación.
 * Cada stat tiene su propio tinted glow según el acento.
 */
export function StatCard({
  label,
  value,
  formatter,
  icon,
  trend,
  accent = 'violet',
}: StatCardProps) {
  const colors = ACCENT_MAP[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="bezel"
    >
      <div className="bezel-inner p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-ink-500 font-medium mb-2">
              {label}
            </p>
            <p className="text-2xl font-semibold tracking-tight">
              <CountUp to={value} duration={1.4} formatter={formatter} />
            </p>
          </div>
          <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', colors.bg)}>
            <span className={colors.icon}>{icon}</span>
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
            <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
            <span
              className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-neon-green' : 'text-neon-red'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-ink-500">vs mes anterior</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
