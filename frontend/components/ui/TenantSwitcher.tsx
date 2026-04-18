'use client';

import { useTenant } from '@/lib/tenant-context';
import { motion } from 'framer-motion';

const BADGE: Record<string, string> = {
  papeleria: 'bg-blue-500/10 text-blue-300',
  carniceria: 'bg-red-500/10 text-red-300',
  electronica: 'bg-emerald-500/10 text-emerald-300',
  generico: 'bg-ink-700/40 text-ink-300',
};

export function TenantSwitcher() {
  const { tenants, active, setActiveSlug } = useTenant();

  return (
    <div className="flex flex-wrap gap-2">
      {tenants.map((t) => {
        const isActive = active?.slug === t.slug;
        return (
          <motion.button
            key={t.id}
            onClick={() => setActiveSlug(t.slug)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`relative px-3.5 py-1.5 rounded-full text-sm hairline transition ${
              isActive ? 'bg-ink-100 text-ink-950' : 'text-ink-300 hover:text-ink-100'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="tenant-pill"
                className="absolute inset-0 rounded-full bg-ink-100"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {t.nombre}
              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${BADGE[t.tipo_negocio]}`}>
                {t.tipo_negocio}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
