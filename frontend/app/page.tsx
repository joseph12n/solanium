'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Receipt,
  Users,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  FileText,
  Beef,
  Cpu,
  Package,
  ClipboardList,
  Sparkles,
  Clock,
  Palette,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import { api, type InvoiceSummary, type TipoNegocio } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

import SplitText from '@/components/reactbits/SplitText';
import BlurText from '@/components/reactbits/BlurText';
import GradientText from '@/components/reactbits/GradientText';
import RotatingText from '@/components/reactbits/RotatingText';
import ShinyText from '@/components/reactbits/ShinyText';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import DecryptedText from '@/components/reactbits/DecryptedText';
import { StatCard } from '@/components/ui/StatCard';
import { ShineButton } from '@/components/ui/ShineButton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { addToast } from '@/components/ui/Toaster';

const EASE = [0.23, 1, 0.32, 1] as const;

const RUBRO_META: Record<
  TipoNegocio,
  {
    rotating: string[];
    inventoryIcon: LucideIcon;
    accent: string;
    spotlight: string;
  }
> = {
  papeleria: {
    rotating: ['libretas', 'folios', 'tintas', 'escolares'],
    inventoryIcon: Package,
    accent: 'from-sky-500/20 to-indigo-500/20',
    spotlight: 'rgba(99, 102, 241, 0.18)',
  },
  carniceria: {
    rotating: ['res', 'cerdo', 'pollo', 'embutidos'],
    inventoryIcon: Beef,
    accent: 'from-red-500/20 to-orange-500/20',
    spotlight: 'rgba(239, 68, 68, 0.18)',
  },
  electronica: {
    rotating: ['phones', 'cables', 'serials', 'parts'],
    inventoryIcon: Cpu,
    accent: 'from-emerald-500/20 to-cyan-500/20',
    spotlight: 'rgba(16, 185, 129, 0.18)',
  },
  generico: {
    rotating: ['services', 'goods', 'parts', 'all'],
    inventoryIcon: ClipboardList,
    accent: 'from-violet-500/20 to-fuchsia-500/20',
    spotlight: 'rgba(168, 85, 247, 0.18)',
  },
};

export default function HomePage() {
  const params = useSearchParams();
  const welcomeName = params.get('welcome');
  const { tenant, user, activation, loading } = useSession();
  const { t } = useLanguage();

  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(Boolean(welcomeName));
  const [error, setError] = useState<string | null>(null);

  // Parallax mouse effect on hero
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const heroX = useTransform(sx, (v) => v * 8);
  const heroY = useTransform(sy, (v) => v * 8);

  const tenantId = tenant?.id;
  useEffect(() => {
    if (!tenantId) return;
    setError(null);
    Promise.allSettled([
      api.invoiceSummary(),
      api.listProducts({ limit: 500 }),
      api.listCustomers(),
    ]).then(([sumRes, prodRes, custRes]) => {
      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data);
      } else {
        const msg = sumRes.reason instanceof Error ? sumRes.reason.message : 'Error de resumen';
        setError(msg);
        addToast('error', msg);
      }
      if (prodRes.status === 'fulfilled') setProductCount(prodRes.value.data.length);
      if (custRes.status === 'fulfilled') setCustomerCount(custRes.value.data.length);
    });
  }, [tenantId]);

  useEffect(() => {
    if (!showWelcome) return;
    const id = setTimeout(() => setShowWelcome(false), 3500);
    return () => clearTimeout(id);
  }, [showWelcome]);

  const inventoryLabel = useMemo(() => {
    switch (tenant?.tipo_negocio) {
      case 'carniceria': return t('nav.cuts');
      case 'electronica': return t('nav.stock');
      case 'papeleria': return t('nav.inventory');
      default: return t('nav.catalog');
    }
  }, [tenant?.tipo_negocio, t]);

  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'rgb(var(--brand-primary) / 0.3)',
            borderTopColor: 'rgb(var(--brand-primary))',
          }}
        />
      </div>
    );
  }

  const meta = RUBRO_META[tenant.tipo_negocio] || RUBRO_META.generico;
  const InventoryIcon = meta.inventoryIcon;
  const empresa = tenant.branding?.empresa || tenant.nombre;
  const eslogan = tenant.branding?.eslogan as string | undefined;

  const expires = activation?.expires_at ? new Date(activation.expires_at) : null;
  const daysLeft = expires
    ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="relative px-6 py-8 max-w-6xl mx-auto space-y-10">
      <ErrorBanner
        error={error}
        onDismiss={() => setError(null)}
      />

      {/* Welcome flash */}
      {showWelcome && welcomeName && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 right-6 z-20 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
          style={{
            background: 'rgb(var(--success) / 0.1)',
            border: '1px solid rgb(var(--success) / 0.3)',
            color: 'rgb(var(--success))',
          }}
        >
          <Sparkles size={14} />
          <span>
            {t('dashboard.welcome')}, <strong>{welcomeName}</strong>
          </span>
        </motion.div>
      )}

      {/* Hero with parallax */}
      <motion.section
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
          my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className={`relative space-y-6 rounded-3xl p-8 border bg-gradient-to-br ${meta.accent} overflow-hidden`}
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <motion.div
          aria-hidden
          style={{
            x: heroX,
            y: heroY,
            background:
              'radial-gradient(circle at 30% 30%, rgb(var(--brand-primary) / 0.18), transparent 60%)',
          }}
          className="absolute inset-0 pointer-events-none"
        />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex items-center justify-between flex-wrap gap-3"
          >
            <ShinyText
              text={`· ${tenant.tipo_negocio} · ${tenant.plan || 'trial'} ·`}
              speed={3}
              className="text-xs uppercase tracking-[0.2em] font-medium"
              color="#63636e"
              shineColor="#a1a1aa"
            />
            {daysLeft !== null && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={12} />
                <span>
                  {t('dashboard.licenseValid')} ·{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {daysLeft} {t('dashboard.days')}
                  </strong>
                </span>
              </div>
            )}
          </motion.div>

          <div className="space-y-1 mt-6">
            <SplitText
              text={`${t('dashboard.welcome')}${user ? `, ${user.nombre.split(' ')[0]}` : ''}`}
              tag="h1"
              className="text-4xl lg:text-5xl font-semibold tracking-tight"
              delay={0.025}
            />
            <div className="flex items-baseline gap-3 flex-wrap">
              <GradientText
                colors={['#6e56cf', '#0a9d7f', '#22d3ee', '#6e56cf']}
                animationSpeed={5}
                className="text-4xl lg:text-5xl font-bold tracking-tight"
              >
                {empresa}
              </GradientText>
            </div>
          </div>

          <div className="flex items-center gap-2 text-lg mt-4" style={{ color: 'var(--text-secondary)' }}>
            <span>{t('dashboard.yourPanel')}</span>
            <RotatingText
              texts={meta.rotating}
              rotationInterval={2400}
              staggerDuration={0.025}
              mainClassName="text-lg font-medium"
              elementLevelClassName=""
            />
            <span>{t('dashboard.isReady')}</span>
          </div>

          {eslogan && (
            <BlurText
              text={eslogan}
              className="text-sm italic max-w-lg mt-3"
              delay={0.05}
            />
          )}

          {activation && (
            <div className="pt-3 text-[10px] font-mono flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="uppercase tracking-widest">activation</span>
              <DecryptedText
                text={activation.id.slice(0, 12)}
                animateOn="view"
                className=""
                encryptedClassName=""
              />
            </div>
          )}
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.todaysIncome')}
          value={Number(summary?.ingresos_hoy || 0)}
          formatter={(v) => formatCurrency(v)}
          icon={<DollarSign size={18} />}
          accent="green"
        />
        <StatCard
          label={t('dashboard.todaysInvoices')}
          value={summary?.count_hoy || 0}
          icon={<FileText size={18} />}
          accent="violet"
        />
        <StatCard
          label={t('dashboard.totalIncome')}
          value={Number(summary?.ingresos_total || 0)}
          formatter={(v) => formatCurrency(v)}
          icon={<TrendingUp size={18} />}
          accent="cyan"
        />
        <StatCard
          label={t('dashboard.totalInvoices')}
          value={summary?.count_total || 0}
          icon={<Receipt size={18} />}
          accent="orange"
        />
      </section>

      {/* Modules */}
      <section className="space-y-4">
        <BlurText
          text={t('dashboard.mainModules')}
          className="text-lg font-medium tracking-tight"
          delay={0.05}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: '/facturacion',
              title: t('nav.invoicing'),
              desc: `${summary?.count_total || 0} · ${t('common.total')}`,
              icon: <Receipt size={20} />,
              accent: 'rgba(110, 86, 207, 0.18)' as const,
            },
            {
              href: '/clientes',
              title: t('nav.customers'),
              desc: `${customerCount}`,
              icon: <Users size={20} />,
              accent: 'rgba(34, 211, 238, 0.12)' as const,
            },
            {
              href: '/inventario',
              title: inventoryLabel,
              desc: `${productCount}`,
              icon: <InventoryIcon size={20} />,
              accent: meta.spotlight,
            },
            {
              href: '/usuarios',
              title: t('nav.users'),
              desc: t('users.invite'),
              icon: <UserCog size={20} />,
              accent: 'rgba(16, 185, 129, 0.14)' as const,
            },
          ].map((mod, i) => (
            <motion.div
              key={mod.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: EASE }}
            >
              <Link href={mod.href}>
                <SpotlightCard spotlightColor={mod.accent} className="h-full cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl"
                      style={{
                        background: 'rgb(var(--surface-raised))',
                        color: 'rgb(var(--brand-primary))',
                      }}
                    >
                      {mod.icon}
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                    />
                  </div>
                  <h3 className="text-base font-medium tracking-tight mb-1">{mod.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {mod.desc}
                  </p>
                </SpotlightCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="flex flex-wrap gap-3 pt-4">
        <Link href="/facturacion">
          <ShineButton variant="primary" icon={<Receipt size={14} />}>
            {t('dashboard.newInvoice')}
          </ShineButton>
        </Link>
        <Link href="/inventario">
          <ShineButton variant="ghost" icon={<InventoryIcon size={14} />}>
            {t('inventory.addItem')}
          </ShineButton>
        </Link>
        <Link href="/plantillas">
          <ShineButton variant="ghost" icon={<Palette size={14} />}>
            {t('dashboard.customizeTemplate')}
          </ShineButton>
        </Link>
      </section>
    </div>
  );
}
