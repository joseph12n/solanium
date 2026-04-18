'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { TenantSwitcher } from '@/components/ui/TenantSwitcher';
import { api, type Product } from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function InventarioPage() {
  const { active, loading: tenantLoading } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const { data } = await api.listProducts(active.slug);
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (tenantLoading) {
    return <PageSkeleton />;
  }

  return (
    <main className="min-h-screen px-6 md:px-10 py-10 max-w-6xl mx-auto">
      <header className="flex flex-col gap-6 mb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">Solanium · Inventario</div>
            <h1 className="text-4xl font-semibold tracking-tight mt-2">
              {active?.nombre ?? 'Sin tenant'}
            </h1>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-full text-sm font-medium hairline hairline-hover bg-white/5"
          >
            {showForm ? 'Cerrar' : '+ Nuevo producto'}
          </motion.button>
        </div>
        <TenantSwitcher />
      </header>

      <AnimatePresence>
        {showForm && active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mb-10 overflow-hidden"
          >
            <ProductForm
              tenantSlug={active.slug}
              tipoNegocio={active.tipo_negocio}
              onCreated={() => {
                setShowForm(false);
                refresh();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <AnimatePresence mode="popLayout">
          {loading ? (
            <SkeletonGrid key="skeleton" />
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass hairline rounded-2xl p-10 text-center text-ink-500"
            >
              Aún no hay productos para <span className="text-ink-300">{active?.nombre}</span>.
              Crea el primero para ver los campos adaptados al rubro.
            </motion.div>
          ) : (
            <motion.div
              key={active?.slug}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  tipoNegocio={active!.tipo_negocio}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer hairline rounded-2xl h-36"
          style={{ opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <div className="shimmer-bg animate-shimmer h-8 w-60 rounded mb-6" />
      <div className="shimmer-bg animate-shimmer h-10 w-full rounded mb-10" />
      <SkeletonGrid />
    </main>
  );
}
