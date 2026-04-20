'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useSession } from '@/lib/session-context';
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

const EASE = [0.23, 1, 0.32, 1] as const;

// Copy por rubro — el sistema cambia de piel según qué compró el cliente
import type { LucideIcon } from 'lucide-react';

const RUBRO_META: Record<
  TipoNegocio,
  {
    tagline: string;
    rotating: string[];
    inventoryLabel: string;
    inventoryIcon: LucideIcon;
    accent: string;
    spotlight: string;
  }
> = {
  papeleria: {
    tagline: 'Papelería',
    rotating: ['libretas', 'folios', 'tintas', 'escolares'],
    inventoryLabel: 'Productos',
    inventoryIcon: Package,
    accent: 'from-sky-500/20 to-indigo-500/20',
    spotlight: 'rgba(99, 102, 241, 0.18)',
  },
  carniceria: {
    tagline: 'Carnicería',
    rotating: ['res', 'cerdo', 'pollo', 'embutidos'],
    inventoryLabel: 'Cortes',
    inventoryIcon: Beef,
    accent: 'from-red-500/20 to-orange-500/20',
    spotlight: 'rgba(239, 68, 68, 0.18)',
  },
  electronica: {
    tagline: 'Electrónica',
    rotating: ['celulares', 'cables', 'seriales', 'accesorios'],
    inventoryLabel: 'Stock',
    inventoryIcon: Cpu,
    accent: 'from-emerald-500/20 to-cyan-500/20',
    spotlight: 'rgba(16, 185, 129, 0.18)',
  },
  generico: {
    tagline: 'Catálogo libre',
    rotating: ['servicios', 'productos', 'insumos', 'todo'],
    inventoryLabel: 'Catálogo',
    inventoryIcon: ClipboardList,
    accent: 'from-violet-500/20 to-fuchsia-500/20',
    spotlight: 'rgba(168, 85, 247, 0.18)',
  },
};

export default function HomePage() {
  const params = useSearchParams();
  const welcomeName = params.get('welcome');
  const { tenant, user, activation, loading } = useSession();

  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(Boolean(welcomeName));

  useEffect(() => {
    if (!tenant) return;
    Promise.allSettled([
      api.invoiceSummary(),
      api.listProducts({ limit: 1 }),
      api.listCustomers(),
    ]).then(([sumRes, prodRes, custRes]) => {
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (prodRes.status === 'fulfilled') setProductCount(prodRes.value.data.length);
      if (custRes.status === 'fulfilled') setCustomerCount(custRes.value.data.length);
    });
  }, [tenant]);

  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => setShowWelcome(false), 3500);
    return () => clearTimeout(t);
  }, [showWelcome]);

  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent-500/30 border-t-accent-500 animate-spin" />
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
      {/* ─── Welcome flash al logueo ─── */}
      {showWelcome && welcomeName && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 right-6 z-20 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2"
        >
          <Sparkles size={14} />
          <span>Bienvenido a <strong>{welcomeName}</strong></span>
        </motion.div>
      )}

      {/* ─── Hero contextual ─── */}
      <section className={`relative space-y-6 rounded-3xl p-8 border border-white/[0.05] bg-gradient-to-br ${meta.accent}`}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <ShinyText
            text={`· ${meta.tagline} · ${tenant.plan || 'trial'} ·`}
            speed={3}
            className="text-xs uppercase tracking-[0.2em] font-medium"
            color="#63636e"
            shineColor="#a1a1aa"
          />
          {daysLeft !== null && (
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <Clock size={12} />
              <span>
                Licencia vigente · <strong className="text-ink-200">{daysLeft} días</strong>
              </span>
            </div>
          )}
        </motion.div>

        <div className="space-y-1">
          <SplitText
            text={`Hola${user ? `, ${user.nombre.split(' ')[0]}` : ''}`}
            tag="h1"
            className="text-4xl lg:text-5xl font-semibold tracking-tight text-ink-200"
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

        <div className="flex items-center gap-2 text-lg text-ink-400">
          <span>Tu panel de</span>
          <RotatingText
            texts={meta.rotating}
            rotationInterval={2400}
            staggerDuration={0.025}
            mainClassName="text-lg font-medium text-accent-light"
            elementLevelClassName="text-accent-light"
          />
          <span>está listo.</span>
        </div>

        {eslogan && (
          <BlurText
            text={eslogan}
            className="text-sm text-ink-500 italic max-w-lg"
            delay={0.05}
          />
        )}

        {/* ID de activación — estético, demuestra que estás conectado */}
        {activation && (
          <div className="pt-1 text-[10px] font-mono text-ink-600 flex items-center gap-2">
            <span className="uppercase tracking-widest">Activation</span>
            <DecryptedText
              text={activation.id.slice(0, 12)}
              animateOn="view"
              className="text-ink-400"
              encryptedClassName="text-ink-700"
            />
          </div>
        )}
      </section>

      {/* ─── Stats Grid ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos hoy"
          value={Number(summary?.ingresos_hoy || 0)}
          formatter={(v) => formatCurrency(v)}
          icon={<DollarSign size={18} />}
          accent="green"
          trend={summary ? { value: 12, positive: true } : undefined}
        />
        <StatCard
          label="Facturas hoy"
          value={summary?.count_hoy || 0}
          icon={<FileText size={18} />}
          accent="violet"
        />
        <StatCard
          label="Ingresos totales"
          value={Number(summary?.ingresos_total || 0)}
          formatter={(v) => formatCurrency(v)}
          icon={<TrendingUp size={18} />}
          accent="cyan"
          trend={summary ? { value: 8, positive: true } : undefined}
        />
        <StatCard
          label="Total facturas"
          value={summary?.count_total || 0}
          icon={<Receipt size={18} />}
          accent="orange"
        />
      </section>

      {/* ─── Módulos Rápidos ─── */}
      <section className="space-y-4">
        <BlurText
          text="Módulos principales"
          className="text-lg font-medium text-ink-300 tracking-tight"
          delay={0.05}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: '/facturacion',
              title: 'Facturación',
              desc: 'Punto de venta y emisión de facturas en tiempo real',
              icon: <Receipt size={20} />,
              accent: 'rgba(110, 86, 207, 0.18)' as const,
              iconColor: 'text-accent-light',
            },
            {
              href: '/clientes',
              title: 'Clientes',
              desc: `${customerCount} registrados · gestiona tu cartera completa`,
              icon: <Users size={20} />,
              accent: 'rgba(34, 211, 238, 0.12)' as const,
              iconColor: 'text-neon-cyan',
            },
            {
              href: '/inventario',
              title: meta.inventoryLabel,
              desc: `${productCount} ítems · stock y precios adaptados a ${meta.tagline.toLowerCase()}`,
              icon: <InventoryIcon size={20} />,
              accent: meta.spotlight,
              iconColor: 'text-neon-green',
            },
          ].map((mod, i) => (
            <motion.div
              key={mod.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: EASE }}
            >
              <Link href={mod.href}>
                <SpotlightCard
                  spotlightColor={mod.accent}
                  className="h-full cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] ${mod.iconColor}`}
                    >
                      {mod.icon}
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="text-ink-600 group-hover:text-ink-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
                    />
                  </div>
                  <h3 className="text-base font-medium tracking-tight mb-1">{mod.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{mod.desc}</p>
                </SpotlightCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Quick Actions ─── */}
      <section className="flex flex-wrap gap-3 pt-4">
        <Link href="/facturacion">
          <ShineButton variant="primary" icon={<Receipt size={14} />}>
            Nueva factura
          </ShineButton>
        </Link>
        <Link href="/inventario">
          <ShineButton variant="ghost" icon={<InventoryIcon size={14} />}>
            Agregar ítem a {meta.inventoryLabel.toLowerCase()}
          </ShineButton>
        </Link>
        <Link href="/plantillas">
          <ShineButton variant="ghost">Personalizar plantilla</ShineButton>
        </Link>
      </section>
    </div>
  );
}
