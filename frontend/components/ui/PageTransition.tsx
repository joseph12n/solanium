'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * PageTransition — fade-blur al cambiar de ruta.
 *
 * Usa `key={pathname}` para que React remonte el contenido en cada ruta y
 * el useEffect de la nueva página dispare de inmediato. NO se usa
 * AnimatePresence con `mode="wait"` porque ésa bloquea el mount de la ruta
 * entrante hasta que termine la animación de salida de la saliente — lo que
 * provoca que los data-fetches tarden 250 ms en dispararse y, en algunos
 * escenarios de StrictMode + hot-reload, directamente no se disparen.
 */
export function PageTransition({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
