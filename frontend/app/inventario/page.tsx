'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { api, type Product } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import SplitText from '@/components/reactbits/SplitText';
import BlurText from '@/components/reactbits/BlurText';
import { ShineButton } from '@/components/ui/ShineButton';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function InventarioPage() {
  const { tenant, loading: tenantLoading } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const { data } = await api.listProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => { refresh(); }, [refresh]);

  if (tenantLoading) return <PageSkeleton />;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-end justify-between mb-8"
      >
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-medium">
            Inventario
          </span>
          <SplitText
            text={tenant?.branding?.empresa || tenant?.nombre || 'Sin tenant'}
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.03}
          />
          <p className="text-sm text-ink-500 mt-2">
            {products.length} productos registrados
          </p>
        </div>
        <ShineButton
          onClick={() => setShowForm((s) => !s)}
          variant={showForm ? 'ghost' : 'primary'}
          icon={<Plus size={14} />}
        >
          {showForm ? 'Cerrar formulario' : 'Nuevo producto'}
        </ShineButton>
      </motion.header>

      {/* ── Product Form (collapsible) ── */}
      <AnimatePresence>
        {showForm && tenant && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mb-8 overflow-hidden"
          >
            <ProductForm
              tipoNegocio={tenant.tipo_negocio}
              onCreated={() => {
                setShowForm(false);
                refresh();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product Grid ── */}
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
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-ink-600 opacity-40" />
              </div>
              <p className="text-ink-400 font-medium">
                Aún no hay productos para <span className="text-ink-200">{tenant?.branding?.empresa || tenant?.nombre}</span>
              </p>
              <p className="text-xs text-ink-600 mt-1">
                Crea el primero para ver los campos adaptados al rubro
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={tenant?.slug}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  tipoNegocio={tenant!.tipo_negocio}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shimmer-bg animate-shimmer rounded-2xl h-36" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="shimmer-bg animate-shimmer h-8 w-60 rounded-lg mb-6" />
      <div className="shimmer-bg animate-shimmer h-10 w-full rounded-lg mb-10" />
      <SkeletonGrid />
    </div>
  );
}
