'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * PageTransition — Envuelve children con fade-blur transitions al cambiar de ruta.
 * Usa AnimatePresence con mode="wait" para esperar el exit antes del enter.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
        transition={{
          duration: 0.25,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
