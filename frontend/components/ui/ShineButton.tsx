'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * ShineButton — Premium button con shine sweep y active press feedback.
 * scale(0.97) on press (Emil Kowalski), clip-path shine animation.
 */
export function ShineButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}: ShineButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-medium rounded-xl overflow-hidden transition-all duration-200 ease-out-expo select-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-glow-sm hover:shadow-glow-md',
    accent:
      'bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/15',
    ghost:
      'bg-white/[0.04] text-ink-200 border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], disabled && 'opacity-50 cursor-not-allowed', className)}
      {...(props as any)}
    >
      {/* Shine sweep */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />
      {/* Icon island (button-in-button) */}
      {icon && (
        <span className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-white/10 group-hover:translate-x-0.5 transition-transform duration-200">
          {icon}
        </span>
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
