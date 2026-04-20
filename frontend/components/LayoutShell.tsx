'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/lib/session-context';
import { Sidebar } from '@/components/ui/Sidebar';
import { Toaster } from '@/components/ui/Toaster';
import { PageTransition } from '@/components/ui/PageTransition';
import { UserMenu } from '@/components/ui/UserMenu';

/**
 * LayoutShell — Chrome global:
 *   • Aplica el branding del tenant (logo + colores) inyectando CSS vars
 *     en :root. Los componentes con `var(--brand-*)` heredan el color.
 *   • Oculta sidebar/header en rutas públicas (/login).
 *   • Muestra UserMenu (reemplaza TenantSwitcher) con tenant + logout.
 */
export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tenant, loading } = useSession();
  const isAuthShell = pathname !== '/login';

  // Inyectar branding colors como CSS vars globales
  useEffect(() => {
    const root = document.documentElement;
    const b = tenant?.branding || {};
    if (b.color_primario) root.style.setProperty('--brand-primary', String(b.color_primario));
    else root.style.removeProperty('--brand-primary');
    if (b.color_secundario) root.style.setProperty('--brand-secondary', String(b.color_secundario));
    else root.style.removeProperty('--brand-secondary');
  }, [tenant?.branding]);

  if (!isAuthShell) {
    return (
      <>
        <PageTransition>{children}</PageTransition>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="pl-[72px] lg:pl-[240px] transition-all duration-300 ease-out-expo">
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-white/[0.04] bg-surface-base/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-ink-500 uppercase tracking-[0.15em] font-medium">
              {tenant?.branding?.empresa || tenant?.nombre || 'Sistema de facturación'}
            </div>
            {tenant?.tipo_negocio && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-light">
                {tenant.tipo_negocio}
              </span>
            )}
          </div>
          {!loading && <UserMenu />}
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <Toaster />
    </>
  );
}
