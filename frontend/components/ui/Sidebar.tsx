'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Palette,
  Package,
  ChevronLeft,
  ChevronRight,
  Beef,
  Cpu,
  ClipboardList,
  Sparkles,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import GradientText from '@/components/reactbits/GradientText';
import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import type { TipoNegocio } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Sidebar — Navegación lateral adaptada a `tenant.tipo_negocio`.
 *
 * El label/icono de "Inventario" cambia según el rubro:
 *   • papeleria   → Package "Inventario"
 *   • carniceria  → Beef "Cortes / Inventario"
 *   • electronica → Cpu "Stock / Seriales"
 *   • generico    → ClipboardList "Catálogo"
 *
 * Siempre incluye Facturación, Clientes y Plantillas. Si hay `logo_url`
 * en branding, reemplaza la S por el logo de la empresa.
 */

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

function inventoryLink(tipo: TipoNegocio | undefined, t: (k: string) => string): NavLink {
  switch (tipo) {
    case 'carniceria':
      return { href: '/inventario', label: t('nav.cuts'), icon: Beef };
    case 'electronica':
      return { href: '/inventario', label: t('nav.stock'), icon: Cpu };
    case 'papeleria':
      return { href: '/inventario', label: t('nav.inventory'), icon: Package };
    default:
      return { href: '/inventario', label: t('nav.catalog'), icon: ClipboardList };
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { tenant } = useSession();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const links: NavLink[] = [
    { href: '/', label: t('nav.home'), icon: LayoutDashboard },
    { href: '/facturacion', label: t('nav.invoicing'), icon: Receipt },
    inventoryLink(tenant?.tipo_negocio, t),
    { href: '/clientes', label: t('nav.customers'), icon: Users },
    { href: '/usuarios', label: t('nav.users'), icon: UserCog },
    { href: '/plantillas', label: t('nav.templates'), icon: Palette },
  ];

  const empresa = tenant?.branding?.empresa || 'Solanium';
  const logo = tenant?.branding?.logo_url as string | undefined;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col"
    >
      <div className="absolute inset-0 bg-surface-base/90 backdrop-blur-2xl border-r border-white/[0.04]" />

      <div className="relative flex flex-col h-full">
        {/* Logo / branding */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.04]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-glow-sm overflow-hidden">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={empresa} className="w-full h-full object-cover" />
            ) : (
              empresa.slice(0, 1).toUpperCase()
            )}
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="min-w-0"
            >
              {tenant?.branding?.empresa ? (
                <div className="font-semibold tracking-tight text-base text-ink-100 truncate">
                  {tenant.branding.empresa}
                </div>
              ) : (
                <GradientText
                  colors={['#6e56cf', '#0a9d7f', '#22d3ee', '#6e56cf']}
                  animationSpeed={6}
                  className="font-semibold tracking-tight text-lg"
                >
                  Solanium
                </GradientText>
              )}
              {tenant && (
                <div className="text-[10px] text-ink-500 uppercase tracking-wider truncate">
                  {tenant.tipo_negocio}
                </div>
              )}
            </motion.div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out-expo group',
                  active
                    ? 'text-white'
                    : 'text-ink-400 hover:text-ink-100 hover:bg-white/[0.04]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute inset-0 rounded-xl bg-accent-500/[0.12] border border-accent-500/20"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {active && (
                  <motion.div
                    layoutId="sidebar-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-500"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  size={18}
                  className={cn(
                    'flex-shrink-0 relative z-10 transition-transform duration-200',
                    active ? 'text-accent-light' : 'group-hover:scale-110'
                  )}
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="truncate relative z-10"
                  >
                    {link.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Badge plan al pie */}
        {!collapsed && tenant && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-accent-500/[0.08] to-primary/[0.06] border border-white/[0.04]">
              <Sparkles size={13} className="text-accent-light" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-ink-500">Plan</div>
                <div className="text-xs font-medium text-ink-200 truncate capitalize">
                  {tenant.plan || 'trial'}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center h-12 border-t border-white/[0.04] text-ink-500 hover:text-ink-200 transition-colors duration-200 ease-out-expo"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
