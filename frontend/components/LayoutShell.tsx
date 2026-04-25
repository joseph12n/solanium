'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/lib/session-context';
import { Sidebar } from '@/components/ui/Sidebar';
import { Toaster } from '@/components/ui/Toaster';
import { PageTransition } from '@/components/ui/PageTransition';
import { UserMenu } from '@/components/ui/UserMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LangSwitcher } from '@/components/ui/LangSwitcher';
import Particles from '@/components/reactbits/Particles';

/**
 * Convierte un color hex (#rrggbb / #rgb) a triplete "R G B" usable
 * dentro de `rgb(var(--brand-primary) / 0.5)`. Devuelve null si inválido.
 */
function hexToRgbTriplet(hex?: string): string | null {
  if (!hex) return null;
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * LayoutShell — Chrome global:
 *   • Inyecta branding del tenant + template skin (card-style, button-style,
 *     typography-scale, particle variant) como CSS vars y data attributes
 *     en :root, de forma que cualquier componente hereda el "skin".
 *   • Muestra background de partículas reactivas al mouse.
 *   • Header expone ThemeToggle + LangSwitcher + UserMenu.
 *   • Oculta sidebar/header en rutas públicas (/login).
 */
export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tenant, activeTemplate, loading } = useSession();
  const isAuthShell = pathname !== '/login';

  // Inyectar branding + template theme como CSS vars + data-attrs
  useEffect(() => {
    const root = document.documentElement;
    const b = tenant?.branding;
    const t = activeTemplate?.theme;

    const primary = t?.color_primary || (b?.color_primario as string | undefined);
    const secondary = t?.color_secondary || (b?.color_secundario as string | undefined);

    const primaryRgb = hexToRgbTriplet(primary);
    const secondaryRgb = hexToRgbTriplet(secondary);

    if (primaryRgb) {
      root.style.setProperty('--brand-primary', primaryRgb);
      root.style.setProperty('--brand-primary-hex', primary || '');
    } else {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-hex');
    }
    if (secondaryRgb) {
      root.style.setProperty('--brand-secondary', secondaryRgb);
      root.style.setProperty('--brand-secondary-hex', secondary || '');
    } else {
      root.style.removeProperty('--brand-secondary');
      root.style.removeProperty('--brand-secondary-hex');
    }

    const cardStyle = t?.card_style || 'bezel';
    const buttonStyle = t?.button_style || 'rounded';
    const typeScale = t?.typography_scale || 'default';

    root.setAttribute('data-card-style', cardStyle);
    root.setAttribute('data-button-style', buttonStyle);
    root.setAttribute('data-type-scale', typeScale);
  }, [tenant?.branding, activeTemplate]);

  const particleVariant =
    (activeTemplate?.theme?.particle_variant as 'particles' | 'aurora' | 'none' | undefined) ||
    (isAuthShell ? 'particles' : 'aurora');

  const particleColor = (activeTemplate?.theme?.color_primary as string | undefined) ||
    (tenant?.branding?.color_primario as string | undefined);

  if (!isAuthShell) {
    return (
      <>
        {particleVariant !== 'none' && (
          <Particles variant={particleVariant} color={particleColor} />
        )}
        <div className="content-layer">
          <PageTransition>{children}</PageTransition>
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <>
      {particleVariant !== 'none' && (
        <Particles variant={particleVariant} color={particleColor} />
      )}
      <div className="content-layer">
        <Sidebar />
        <div className="pl-[72px] lg:pl-[240px] transition-all duration-300 ease-out-expo">
          <header
            className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b backdrop-blur-xl"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'rgb(var(--surface-base) / 0.75)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="text-xs uppercase tracking-[0.15em] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {tenant?.branding?.empresa || tenant?.nombre || 'Sistema de facturación'}
              </div>
              {tenant?.tipo_negocio && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-light">
                  {tenant.tipo_negocio}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LangSwitcher />
              <ThemeToggle />
              {!loading && <UserMenu />}
            </div>
          </header>
          <main className="min-h-[calc(100vh-3.5rem)]">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
