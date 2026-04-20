'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, User as UserIcon, Clock } from 'lucide-react';

import { useSession } from '@/lib/session-context';

/**
 * UserMenu — Píldora glass en el header con empresa + avatar.
 * Al hacer click abre un popover con detalles del tenant, del usuario
 * y botón de logout. Reemplaza al viejo TenantSwitcher: con el modelo
 * SaaS basado en token, el tenant ya no se elige — se deriva del token.
 */
export function UserMenu() {
  const { tenant, user, activation, logout } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!tenant) return null;

  const empresa = tenant.branding?.empresa || tenant.nombre;
  const logo = tenant.branding?.logo_url as string | undefined;
  const initials = empresa.slice(0, 2).toUpperCase();

  const expires = activation?.expires_at ? new Date(activation.expires_at) : null;
  const daysLeft = expires
    ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-500 to-primary flex items-center justify-center text-[11px] font-semibold text-white overflow-hidden">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={empresa} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="text-sm text-ink-200 max-w-[120px] truncate">{empresa}</span>
        <ChevronDown size={13} className="text-ink-500" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 mt-2 w-72 rounded-2xl bg-surface-base/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-4 border-b border-white/[0.04] space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Tenant activo
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-100 truncate">{empresa}</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-light">
                  {tenant.tipo_negocio}
                </span>
              </div>
              <div className="text-xs text-ink-500 flex items-center gap-1.5">
                <Clock size={11} />
                <span>
                  {daysLeft !== null
                    ? `${daysLeft} días restantes · plan ${activation?.plan || tenant.plan || '—'}`
                    : `Plan ${tenant.plan || '—'}`}
                </span>
              </div>
            </div>

            {user && (
              <div className="px-4 py-3 border-b border-white/[0.04] space-y-0.5">
                <div className="text-[10px] uppercase tracking-wider text-ink-500">
                  Sesión
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-200">
                  <UserIcon size={12} className="text-ink-500" />
                  <span className="truncate">{user.nombre}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/[0.05] text-ink-400">
                    {user.role}
                  </span>
                </div>
                <div className="text-xs text-ink-500 truncate">{user.email}</div>
              </div>
            )}

            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-ink-300 hover:text-red-300 hover:bg-red-500/5 transition-colors"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
