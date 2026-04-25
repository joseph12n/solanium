'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle,
  Receipt,
  Package,
  Printer,
  Mail,
  CheckCheck,
  Eye,
} from 'lucide-react';
import {
  api,
  type Product,
  type Invoice,
  type CreateInvoicePayload,
  type Customer,
} from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import { cn, formatCurrency } from '@/lib/utils';
import { ShineButton } from '@/components/ui/ShineButton';
import { Confetti } from '@/components/ui/Confetti';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

const EASE = [0.23, 1, 0.32, 1] as const;

type Tab = 'pos' | 'history';

interface CartItem {
  product: Product;
  cantidad: number;
}

export default function FacturacionPage() {
  const { tenant: active } = useSession();
  const { t, lang } = useLanguage();

  const [tab, setTab] = useState<Tab>('pos');

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('');
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tenantId = active?.id;
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    setLoadingProducts(true);
    setError(null);
    try {
      const { data } = await api.listProducts({ search: search || undefined, limit: 50 });
      setProducts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando productos';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoadingProducts(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  useEffect(() => {
    if (!tenantId) return;
    api
      .listCustomers()
      .then((r) => setCustomers(r.data))
      .catch((err) => {
        addToast('error', err instanceof Error ? err.message : 'Error cargando clientes');
      });
  }, [tenantId]);

  const loadHistory = useCallback(async () => {
    if (!tenantId) return;
    setError(null);
    try {
      const { data } = await api.listInvoices({
        limit: 50,
        estado: historyFilter || undefined,
      });
      setInvoices(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando facturas';
      setError(msg);
      addToast('error', msg);
    }
  }, [tenantId, historyFilter]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [loadHistory, tab]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [...prev, { product, cantidad: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === productId
            ? { ...c, cantidad: Math.max(0, c.cantidad + delta) }
            : c
        )
        .filter((c) => c.cantidad > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce(
      (acc, c) => acc + Number(c.product.precio) * c.cantidad,
      0
    );
    const itemCount = cart.reduce((acc, c) => acc + c.cantidad, 0);
    return { subtotal, itemCount };
  }, [cart]);

  const handleCheckout = async () => {
    if (!active || cart.length === 0) return;
    setProcessing(true);
    try {
      const payload: CreateInvoicePayload = {
        customer_id: selectedCustomer || null,
        metodo_pago: metodoPago,
        notas: notas || undefined,
        items: cart.map((c) => ({
          product_id: c.product.id,
          sku: c.product.sku,
          nombre: c.product.nombre,
          unidad: c.product.unidad,
          cantidad: c.cantidad,
          precio_unitario: Number(c.product.precio),
        })),
      };
      const res = await api.createInvoice(payload);
      setShowConfetti(true);
      setShowCheckout(false);
      setCart([]);
      setSelectedCustomer('');
      setNotas('');
      addToast(
        'success',
        `${res.data.numero} · ${formatCurrency(Number(res.data.total))}`
      );
      loadProducts();
      if (tab === 'history') loadHistory();
      setTimeout(() => setShowConfetti(false), 2000);
    } catch (err: any) {
      addToast('error', err.message || 'Error');
    } finally {
      setProcessing(false);
    }
  };

  if (!active) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <Confetti active={showConfetti} />

      {error && (
        <div className="px-4 pt-3">
          <ErrorBanner
            error={error}
            onRetry={tab === 'history' ? loadHistory : loadProducts}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Tab strip */}
      <div
        className="flex items-center gap-1 px-4 pt-4 pb-2 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <TabButton active={tab === 'pos'} onClick={() => setTab('pos')} icon={<ShoppingCart size={14} />}>
          {t('invoicing.pos')}
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<Receipt size={14} />}>
          {t('invoicing.history')}
        </TabButton>
      </div>

      {tab === 'pos' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Catálogo */}
          <div
            className="flex-1 flex flex-col border-r overflow-hidden"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingProducts ? (
                <ProductSkeleton />
              ) : products.length === 0 ? (
                <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgb(var(--surface-raised))' }}
                  >
                    <Package size={24} className="opacity-40" />
                  </div>
                  <p className="font-medium">{t('invoicing.empty')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {products.map((p, i) => {
                      const inCart = cart.find((c) => c.product.id === p.id);
                      return (
                        <motion.button
                          key={p.id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.3, ease: EASE }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => addToCart(p)}
                          className="relative text-left p-4 rounded-xl transition-all duration-200"
                          style={{
                            background: 'rgb(var(--surface-card))',
                            border: inCart
                              ? '1px solid rgb(var(--brand-primary) / 0.4)'
                              : '1px solid var(--border-subtle)',
                            boxShadow: inCart
                              ? '0 0 0 3px rgb(var(--brand-primary) / 0.1)'
                              : undefined,
                          }}
                        >
                          {inCart && (
                            <motion.span
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                              style={{
                                background: 'rgb(var(--brand-primary))',
                                color: 'white',
                              }}
                            >
                              {inCart.cantidad}
                            </motion.span>
                          )}
                          <div
                            className="text-[10px] font-mono uppercase tracking-wider mb-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {p.sku}
                          </div>
                          <div className="font-medium text-sm tracking-tight truncate">
                            {p.nombre}
                          </div>
                          <div className="flex items-center justify-between mt-2.5">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: 'rgb(var(--brand-primary))' }}
                            >
                              {formatCurrency(Number(p.precio))}
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {t('common.stock')}: {Number(p.stock)}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div
            className="w-[340px] lg:w-[380px] flex flex-col flex-shrink-0"
            style={{ background: 'rgb(var(--surface-raised) / 0.5)' }}
          >
            <div
              className="p-4 border-b flex items-center gap-2.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgb(var(--brand-primary) / 0.1)' }}
              >
                <ShoppingCart size={16} style={{ color: 'rgb(var(--brand-primary))' }} />
              </div>
              <h2 className="font-medium tracking-tight">{t('invoicing.cart')}</h2>
              <span
                className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgb(var(--brand-primary) / 0.12)',
                  color: 'rgb(var(--brand-primary))',
                }}
              >
                {cartTotals.itemCount}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <ShoppingCart size={28} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">{t('invoicing.emptyCart')}</p>
                  </motion.div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16, height: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: 'rgb(var(--surface-card))',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.product.nombre}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatCurrency(Number(item.product.precio))} × {item.cantidad}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <QtyBtn onClick={() => updateQty(item.product.id, -1)} icon={<Minus size={12} />} />
                        <span className="w-6 text-center text-sm font-mono">{item.cantidad}</span>
                        <QtyBtn onClick={() => updateQty(item.product.id, 1)} icon={<Plus size={12} />} />
                        <QtyBtn
                          onClick={() => removeFromCart(item.product.id)}
                          icon={<Trash2 size={12} />}
                          tone="danger"
                        />
                      </div>
                      <div className="text-sm font-semibold w-20 text-right font-mono tabular-nums">
                        {formatCurrency(Number(item.product.precio) * item.cantidad)}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div
              className="p-4 border-t space-y-3"
              style={{ borderColor: 'var(--border-subtle)', background: 'rgb(var(--surface-base) / 0.6)' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('invoicing.subtotal')}
                </span>
                <span className="text-xl font-bold tracking-tight font-mono tabular-nums">
                  {formatCurrency(cartTotals.subtotal)}
                </span>
              </div>
              <ShineButton
                size="lg"
                className="w-full"
                disabled={cart.length === 0}
                onClick={() => setShowCheckout(true)}
                icon={<ArrowRight size={14} />}
              >
                {t('invoicing.emit')}
              </ShineButton>
            </div>
          </div>
        </div>
      ) : (
        // ── History tab ─────────────────────────────────────────────
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FilterPill active={historyFilter === ''} onClick={() => setHistoryFilter('')}>
                {t('common.all')}
              </FilterPill>
              <FilterPill active={historyFilter === 'emitida'} onClick={() => setHistoryFilter('emitida')}>
                {t('invoicing.emitted')}
              </FilterPill>
              <FilterPill active={historyFilter === 'pagada'} onClick={() => setHistoryFilter('pagada')}>
                {t('invoicing.paid')}
              </FilterPill>
              <FilterPill active={historyFilter === 'anulada'} onClick={() => setHistoryFilter('anulada')}>
                {t('invoicing.void')}
              </FilterPill>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              {invoices.length === 0 ? (
                <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
                  <Receipt size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('invoicing.empty')}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-left text-[11px] uppercase tracking-[0.15em]"
                      style={{
                        background: 'rgb(var(--surface-raised) / 0.5)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th className="px-4 py-3 font-medium">{t('invoicing.number')}</th>
                      <th className="px-4 py-3 font-medium">{t('invoicing.customer')}</th>
                      <th className="px-4 py-3 font-medium">{t('common.date')}</th>
                      <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('common.total')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3), ease: EASE }}
                        className="border-t group"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{inv.numero}</td>
                        <td className="px-4 py-3">
                          {inv.cliente_nombre || (
                            <span className="italic" style={{ color: 'var(--text-muted)' }}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(inv.emitida_en).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={inv.estado} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                          {formatCurrency(Number(inv.total))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => {
                              const { data } = await api.getInvoice(inv.id);
                              setDetailInvoice(data);
                            }}
                            className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md transition opacity-60 group-hover:opacity-100"
                            style={{ color: 'rgb(var(--brand-primary))' }}
                          >
                            <Eye size={12} /> {t('invoicing.detail')}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        notas={notas}
        setNotas={setNotas}
        processing={processing}
        onConfirm={handleCheckout}
        total={cartTotals.subtotal}
      />

      <InvoiceDetailModal
        invoice={detailInvoice}
        onClose={() => setDetailInvoice(null)}
        onChanged={(next) => {
          setDetailInvoice(next);
          loadHistory();
        }}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg transition"
      style={{
        color: active ? 'rgb(var(--brand-primary))' : 'var(--text-secondary)',
        background: active ? 'rgb(var(--brand-primary) / 0.08)' : 'transparent',
      }}
    >
      {icon}
      {children}
      {active && (
        <motion.span
          layoutId="invoicing-tab-underline"
          className="absolute -bottom-2 left-2 right-2 h-0.5 rounded-full"
          style={{ background: 'rgb(var(--brand-primary))' }}
        />
      )}
    </motion.button>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full transition font-medium"
      style={{
        background: active ? 'rgb(var(--brand-primary) / 0.14)' : 'rgb(var(--surface-raised))',
        color: active ? 'rgb(var(--brand-primary))' : 'var(--text-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {children}
    </button>
  );
}

function EstadoBadge({ estado }: { estado: Invoice['estado'] }) {
  const { t } = useLanguage();
  const map: Record<Invoice['estado'], { bg: string; color: string; label: string }> = {
    emitida: { bg: 'rgb(var(--info) / 0.14)', color: 'rgb(var(--info))', label: t('invoicing.emitted') },
    pagada: { bg: 'rgb(var(--success) / 0.14)', color: 'rgb(var(--success))', label: t('invoicing.paid') },
    anulada: { bg: 'rgb(var(--danger) / 0.14)', color: 'rgb(var(--danger))', label: t('invoicing.void') },
    borrador: { bg: 'rgb(127 127 140 / 0.14)', color: 'var(--text-secondary)', label: t('invoicing.draft') },
  };
  const m = map[estado];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function QtyBtn({
  onClick,
  icon,
  tone = 'default',
}: {
  onClick: () => void;
  icon: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition"
      style={{
        color: tone === 'danger' ? 'rgb(var(--danger))' : 'var(--text-secondary)',
        background: 'rgb(var(--surface-raised))',
      }}
    >
      {icon}
    </motion.button>
  );
}

function CheckoutModal({
  open,
  onClose,
  cart,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  metodoPago,
  setMetodoPago,
  notas,
  setNotas,
  processing,
  onConfirm,
  total,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customers: Customer[];
  selectedCustomer: string;
  setSelectedCustomer: (s: string) => void;
  metodoPago: string;
  setMetodoPago: (s: string) => void;
  notas: string;
  setNotas: (s: string) => void;
  processing: boolean;
  onConfirm: () => void;
  total: number;
}) {
  const { t } = useLanguage();
  return (
    <Modal open={open} onClose={onClose} title={t('invoicing.emit')} size="lg">
      <div className="space-y-5">
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.product.id} className="flex justify-between text-sm">
              <span>{item.product.nombre} × {item.cantidad}</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(Number(item.product.precio) * item.cantidad)}
              </span>
            </div>
          ))}
        </div>
        <div className="h-px" style={{ background: 'var(--border-subtle)' }} />
        <div>
          <Label>{t('invoicing.customer')}</Label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full"
          >
            <option value="">— {t('common.none')} —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.documento ? `(${c.documento})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t('invoicing.paymentMethod')}</Label>
          <div className="flex gap-2">
            {[
              { value: 'efectivo', label: 'Cash', icon: <Banknote size={14} /> },
              { value: 'tarjeta', label: 'Card', icon: <CreditCard size={14} /> },
              { value: 'transferencia', label: 'Transfer', icon: <ArrowRight size={14} /> },
            ].map((m) => (
              <motion.button
                key={m.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMetodoPago(m.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition'
                )}
                style={
                  metodoPago === m.value
                    ? {
                        background: 'rgb(var(--brand-primary) / 0.12)',
                        color: 'rgb(var(--brand-primary))',
                        border: '1px solid rgb(var(--brand-primary) / 0.3)',
                      }
                    : {
                        background: 'rgb(var(--surface-raised))',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }
                }
              >
                {m.icon}
                {m.label}
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <Label>{t('inventory.description')}</Label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full resize-none"
          />
        </div>
        <div className="h-px" style={{ background: 'var(--border-subtle)' }} />
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">{t('common.total')}</span>
          <span className="text-2xl font-bold" style={{ color: 'rgb(var(--brand-primary))' }}>
            {formatCurrency(total)}
          </span>
        </div>
        <ShineButton
          size="lg"
          className="w-full"
          onClick={onConfirm}
          disabled={processing}
          icon={<CheckCircle size={14} />}
        >
          {processing ? t('common.loading') : t('invoicing.emit')}
        </ShineButton>
      </div>
    </Modal>
  );
}

function InvoiceDetailModal({
  invoice,
  onClose,
  onChanged,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onChanged: (inv: Invoice | null) => void;
}) {
  const { t, lang } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [emailTo, setEmailTo] = useState('');

  useEffect(() => {
    setEmailTo('');
  }, [invoice?.id]);

  if (!invoice) return null;

  async function markPaid() {
    if (!invoice) return;
    setBusy(true);
    try {
      const res = await api.markInvoicePaid(invoice.id);
      addToast('success', `${invoice.numero} → ${t('invoicing.paid')}`);
      onChanged(res.data);
    } catch (e: any) {
      addToast('error', e.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail() {
    if (!invoice) return;
    setBusy(true);
    try {
      const res = await api.sendInvoiceEmail(invoice.id, emailTo || undefined);
      addToast('success', `→ ${res.data.to}`);
    } catch (e: any) {
      addToast('error', e.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  function printIt() {
    window.print();
  }

  return (
    <Modal open={!!invoice} onClose={onClose} size="xl">
      <div className="print-page">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              {t('invoicing.number')}
            </div>
            <div className="text-2xl font-bold font-mono mt-1">{invoice.numero}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {new Date(invoice.emitida_en).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US')}
            </div>
          </div>
          <EstadoBadge estado={invoice.estado} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t('invoicing.customer')}
            </div>
            <div className="font-medium mt-1">
              {invoice.cliente_nombre || <span style={{ color: 'var(--text-muted)' }}>—</span>}
            </div>
            {invoice.cliente_documento && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {invoice.cliente_documento}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t('invoicing.paymentMethod')}
            </div>
            <div className="font-medium mt-1 capitalize">{invoice.metodo_pago}</div>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr
              className="text-left text-[10px] uppercase tracking-wider border-b"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
            >
              <th className="py-2 font-medium">{t('common.name')}</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">{t('common.price')}</th>
              <th className="py-2 font-medium text-right">{t('common.total')}</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((it) => (
              <tr key={it.id || it.sku} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="py-2">
                  <div className="font-medium">{it.nombre || it.nombre_snapshot}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {it.sku || it.sku_snapshot}
                  </div>
                </td>
                <td className="py-2 text-right font-mono">{Number(it.cantidad)}</td>
                <td className="py-2 text-right font-mono">{formatCurrency(Number(it.precio_unitario))}</td>
                <td className="py-2 text-right font-mono font-semibold">
                  {formatCurrency(Number(it.subtotal ?? Number(it.precio_unitario) * Number(it.cantidad)))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-2 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('invoicing.subtotal')}
              </td>
              <td className="py-2 text-right font-mono">{formatCurrency(Number(invoice.subtotal))}</td>
            </tr>
            {Number(invoice.impuesto_total) > 0 && (
              <tr>
                <td colSpan={3} className="py-1 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('invoicing.tax')} ({Number(invoice.impuesto_pct)}%)
                </td>
                <td className="py-1 text-right font-mono">{formatCurrency(Number(invoice.impuesto_total))}</td>
              </tr>
            )}
            <tr className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <td colSpan={3} className="pt-3 text-right text-sm font-semibold">
                {t('common.total')}
              </td>
              <td className="pt-3 text-right text-lg font-bold font-mono" style={{ color: 'rgb(var(--brand-primary))' }}>
                {formatCurrency(Number(invoice.total))}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.notas && (
          <div className="text-xs italic mb-6" style={{ color: 'var(--text-muted)' }}>
            {invoice.notas}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 no-print pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        {invoice.estado === 'emitida' && (
          <ActionBtn onClick={markPaid} disabled={busy} icon={<CheckCheck size={14} />} tone="success">
            {t('invoicing.markPaid')}
          </ActionBtn>
        )}
        <ActionBtn onClick={printIt} icon={<Printer size={14} />}>
          {t('invoicing.print')}
        </ActionBtn>
        <div className="flex-1 flex items-center gap-2">
          <input
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="email@…"
            className="flex-1 text-xs"
          />
          <ActionBtn onClick={sendEmail} disabled={busy} icon={<Mail size={14} />}>
            {t('invoicing.sendEmail')}
          </ActionBtn>
        </div>
      </div>
    </Modal>
  );
}

function ActionBtn({
  onClick,
  disabled,
  icon,
  tone = 'default',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  tone?: 'default' | 'success';
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className="text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition disabled:opacity-50"
      style={
        tone === 'success'
          ? {
              background: 'rgb(var(--success) / 0.14)',
              color: 'rgb(var(--success))',
              border: '1px solid rgb(var(--success) / 0.3)',
            }
          : {
              background: 'rgb(var(--surface-raised))',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }
      }
    >
      {icon}
      {children}
    </motion.button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="text-[11px] uppercase tracking-[0.12em] font-medium mb-2 block"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </label>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer rounded-xl h-24"
          style={{ opacity: 1 - i * 0.06 }}
        />
      ))}
    </div>
  );
}
