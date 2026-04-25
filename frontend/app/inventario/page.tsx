'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  History,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';
import { Modal } from '@/components/ui/Modal';
import { ShineButton } from '@/components/ui/ShineButton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { addToast } from '@/components/ui/Toaster';
import SplitText from '@/components/reactbits/SplitText';
import { api, type Product } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';

const EASE = [0.23, 1, 0.32, 1] as const;
const LOW_STOCK_THRESHOLD = 5;

interface PriceEntry {
  price: number;
  changed_at: string;
  changed_by?: string | null;
}

function num(v: unknown) {
  return typeof v === 'number' ? v : Number(v ?? 0);
}

export default function InventarioPage() {
  const { tenant, loading: tenantLoading } = useSession();
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [adjustFor, setAdjustFor] = useState<Product | null>(null);

  const tenantId = tenant?.id;
  const refresh = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.listProducts();
      setProducts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando inventario';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const lowStock = useMemo(
    () => products.filter((p) => num(p.stock) <= LOW_STOCK_THRESHOLD),
    [products]
  );

  const inventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + num(p.precio) * num(p.stock), 0),
    [products]
  );

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirm') + '?')) return;
    try {
      await api.deleteProduct(id);
      addToast('success', t('common.delete'));
      refresh();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error');
    }
  }

  if (tenantLoading) return <PageSkeleton />;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-end justify-between mb-8 gap-4 flex-wrap"
      >
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-medium" style={{ color: 'var(--text-muted)' }}>
            {t('inventory.title')}
          </span>
          <SplitText
            text={tenant?.branding?.empresa || tenant?.nombre || 'Sin tenant'}
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.03}
          />
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {products.length} · {t('inventory.totalItems').toLowerCase()}
          </p>
        </div>
        <ShineButton
          onClick={() => setShowForm((s) => !s)}
          variant={showForm ? 'ghost' : 'primary'}
          icon={<Plus size={14} />}
        >
          {showForm ? t('common.close') : t('inventory.addItem')}
        </ShineButton>
      </motion.header>

      <ErrorBanner
        error={error}
        onRetry={refresh}
        onDismiss={() => setError(null)}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Stat label={t('inventory.totalItems')} value={products.length.toString()} />
        <Stat
          label={t('inventory.lowStock')}
          value={lowStock.length.toString()}
          tone={lowStock.length > 0 ? 'warn' : 'default'}
        />
        <Stat
          label={t('inventory.inventoryValue')}
          value={`$${inventoryValue.toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>

      {/* Low-stock alert */}
      <AnimatePresence>
        {lowStock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mb-6 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{
              background: 'rgb(var(--warn) / 0.08)',
              border: '1px solid rgb(var(--warn) / 0.25)',
            }}
          >
            <AlertTriangle size={16} style={{ color: 'rgb(var(--warn))' }} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <p style={{ color: 'rgb(var(--warn))' }} className="font-medium">
                {t('inventory.stockAlert')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {lowStock
                  .slice(0, 5)
                  .map((p) => `${p.nombre} (${p.stock})`)
                  .join(' · ')}
                {lowStock.length > 5 && ` · +${lowStock.length - 5}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form (collapsible) */}
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

      {/* Search */}
      <div className="mb-4 relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:ring-2 transition"
          style={{
            background: 'rgb(var(--surface-raised))',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Table */}
      <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
        {loading ? (
          <SkeletonRows />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgb(var(--surface-raised))' }}
            >
              <Package size={28} className="opacity-40" />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {tenant?.branding?.empresa || tenant?.nombre}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('inventory.addItem')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[11px] uppercase tracking-[0.15em]"
                  style={{
                    background: 'rgb(var(--surface-raised) / 0.5)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="px-4 py-3 font-medium">{t('inventory.sku')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.price')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.stock')}</th>
                  <th className="px-4 py-3 font-medium">{t('inventory.unit')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const stock = num(p.stock);
                  const low = stock <= LOW_STOCK_THRESHOLD;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3), ease: EASE }}
                      className="border-t group"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.sku}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.nombre}</div>
                        {p.descripcion && (
                          <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                            {p.descripcion}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">${num(p.precio).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs"
                          style={
                            low
                              ? {
                                  background: 'rgb(var(--warn) / 0.12)',
                                  color: 'rgb(var(--warn))',
                                }
                              : { background: 'rgb(var(--surface-raised))' }
                          }
                        >
                          {low && <AlertTriangle size={10} />}
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.unidad}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                          <IconButton
                            onClick={() => setAdjustFor(p)}
                            title={t('common.stock')}
                            icon={<ArrowUp size={13} />}
                          />
                          <IconButton
                            onClick={() => setHistoryFor(p)}
                            title={t('inventory.priceHistory')}
                            icon={<History size={13} />}
                          />
                          <IconButton
                            onClick={() => handleDelete(p.id)}
                            title={t('common.delete')}
                            icon={<Trash2 size={13} />}
                            tone="danger"
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PriceHistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />
      <StockAdjustModal
        product={adjustFor}
        onClose={() => setAdjustFor(null)}
        onSaved={() => {
          setAdjustFor(null);
          refresh();
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warn';
}) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: 'rgb(var(--surface-raised))',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="text-xl font-semibold mt-1"
        style={tone === 'warn' ? { color: 'rgb(var(--warn))' } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  icon,
  tone = 'default',
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md transition-colors"
      style={{
        color: tone === 'danger' ? 'rgb(var(--danger))' : 'var(--text-secondary)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgb(var(--surface-raised))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
    </motion.button>
  );
}

function PriceHistoryModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const history = (product?.metadata?.price_history as PriceEntry[] | undefined) || [];

  return (
    <Modal open={!!product} onClose={onClose} title={`${t('inventory.priceHistory')} · ${product?.nombre || ''}`} size="md">
      {history.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          {t('inventory.noPriceHistory')}
        </p>
      ) : (
        <ul className="space-y-2">
          {[...history].reverse().map((h, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'rgb(var(--surface-raised))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="font-mono">${Number(h.price).toFixed(2)}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(h.changed_at).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US')}
              </span>
            </li>
          ))}
          <li
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium"
            style={{
              background: 'rgb(var(--brand-primary) / 0.12)',
              color: 'rgb(var(--brand-primary))',
            }}
          >
            <span className="font-mono">${num(product?.precio).toFixed(2)}</span>
            <span className="text-xs uppercase tracking-wider">{t('common.status')}</span>
          </li>
        </ul>
      )}
    </Modal>
  );
}

function StockAdjustModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [delta, setDelta] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDelta('');
    setReason('');
  }, [product?.id]);

  async function submit(sign: 1 | -1) {
    if (!product || delta === '' || Number(delta) === 0) return;
    setBusy(true);
    try {
      await api.adjustStock(product.id, {
        delta: sign * Math.abs(Number(delta)),
        reason: reason || undefined,
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!product} onClose={onClose} title={`${t('common.stock')} · ${product?.nombre || ''}`} size="sm">
      <div className="space-y-4">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('common.stock')}: <span className="font-mono">{num(product?.stock)}</span>
        </div>
        <input
          type="number"
          min={1}
          value={delta}
          onChange={(e) => setDelta(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="0"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            background: 'rgb(var(--surface-raised))',
            border: '1px solid var(--border-subtle)',
          }}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('common.name')}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            background: 'rgb(var(--surface-raised))',
            border: '1px solid var(--border-subtle)',
          }}
        />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy || delta === ''}
            onClick={() => submit(-1)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: 'rgb(var(--danger) / 0.12)',
              color: 'rgb(var(--danger))',
              border: '1px solid rgb(var(--danger) / 0.3)',
            }}
          >
            <ArrowDown size={14} /> {t('common.delete')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy || delta === ''}
            onClick={() => submit(1)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: 'rgb(var(--brand-primary) / 0.16)',
              color: 'rgb(var(--brand-primary))',
              border: '1px solid rgb(var(--brand-primary) / 0.3)',
            }}
          >
            <ArrowUp size={14} /> {t('common.create')}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer rounded-lg h-12"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="shimmer-bg animate-shimmer h-8 w-60 rounded-lg mb-6" />
      <div className="shimmer-bg animate-shimmer h-10 w-full rounded-lg mb-10" />
      <SkeletonRows />
    </div>
  );
}
