'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

import { useTheme } from '@/lib/theme-context';

/**
 * ThemeToggle — pill redondo con Sun/Moon que rota al cambiar.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92 }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative w-9 h-9 rounded-full flex items-center justify-center border transition-colors overflow-hidden"
      style={{
        borderColor: 'var(--border-default)',
        background: 'rgb(var(--surface-raised) / 0.6)',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ y: -12, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 12, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: 'var(--text-primary)' }}
        >
          {isDark ? <Moon size={15} /> : <Sun size={15} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
