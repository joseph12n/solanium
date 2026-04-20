'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard,
  Banknote, ArrowRight, CheckCircle, Receipt, Package,
} from 'lucide-react';
import { api, type Product, type Invoice, type CreateInvoicePayload, type Customer } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { cn, formatCurrency } from '@/lib/utils';
import { ShineButton } from '@/components/ui/ShineButton';
import { Confetti } from '@/components/ui/Confetti';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import DecryptedText from '@/components/reactbits/DecryptedText';

const EASE = [0.23, 1, 0.32, 1] as const;

interface CartItem {
  product: Product;
  cantidad: number;
}

export default function FacturacionPage() {
  const { tenant: active } = useSession();

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
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!active) return;
    setLoadingProducts(true);
    try {
      const { data } = await api.listProducts({ search: search || undefined, limit: 50 });
      setProducts(data);
    } catch { /* silencio */ }
    finally { setLoadingProducts(false); }
  }, [active, search]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  useEffect(() => {
    if (!active) return;
    api.listCustomers().then((r) => setCustomers(r.data)).catch(() => {});
  }, [active]);

  const loadRecent = useCallback(async () => {
    if (!active) return;
    try {
      const { data } = await api.listInvoices({ limit: 5 });
      setRecentInvoices(data);
    } catch { /* sin datos */ }
  }, [active]);

  useEffect(() => { loadRecent(); }, [loadRecent]);

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
        .map((c) => c.product.id === productId ? { ...c, cantidad: Math.max(0, c.cantidad + delta) } : c)
        .filter((c) => c.cantidad > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, c) => acc + Number(c.product.precio) * c.cantidad, 0);
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
      setLastInvoice(res.data);
      setShowConfetti(true);
      setShowCheckout(false);
      setCart([]);
      setSelectedCustomer('');
      setNotas('');
      addToast('success', `Factura ${res.data.numero} creada. Total: ${formatCurrency(Number(res.data.total))}`);
      loadProducts();
      loadRecent();
      setTimeout(() => setShowConfetti(false), 2000);
    } catch (err: any) {
      addToast('error', err.message || 'Error al crear factura');
    } finally {
      setProcessing(false);
    }
  };

  if (!active) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-ink-500">Selecciona un tenant para comenzar</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      <Confetti active={showConfetti} />

      {/* ═══ Panel Izquierdo: Catálogo ═══ */}
      <div className="flex-1 flex flex-col border-r border-white/[0.04] overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-white/[0.04]">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 !bg-surface-raised"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <ProductSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-ink-500">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Package size={24} className="opacity-40" />
              </div>
              <p className="font-medium">No se encontraron productos</p>
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
                      transition={{ delay: i * 0.025, duration: 0.3, ease: EASE }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addToCart(p)}
                      className={cn(
                        'relative text-left p-4 rounded-xl transition-all duration-200',
                        'bg-surface-card border border-white/[0.04] hover:border-white/[0.1]',
                        'shadow-inner-light',
                        inCart && 'ring-1 ring-accent-500/30 border-accent-500/20'
                      )}
                    >
                      {inCart && (
                        <motion.span
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm"
                        >
                          {inCart.cantidad}
                        </motion.span>
                      )}
                      <div className="text-[10px] text-ink-600 font-mono uppercase tracking-wider mb-1">
                        {p.sku}
                      </div>
                      <div className="font-medium text-sm tracking-tight truncate">{p.nombre}</div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-sm font-semibold text-accent-light">
                          {formatCurrency(Number(p.precio))}
                        </span>
                        <span className="text-[10px] text-ink-600">
                          Stock: {Number(p.stock)}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.04] flex justify-between items-center">
          <span className="text-xs text-ink-600">{products.length} productos</span>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs text-accent-light hover:text-accent-400 transition-colors flex items-center gap-1.5"
          >
            <Receipt size={12} />
            Historial reciente
          </button>
        </div>
      </div>

      {/* ═══ Panel Derecho: Carrito ═══ */}
      <div className="w-[340px] lg:w-[380px] flex flex-col bg-surface-raised/50 flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.04] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
            <ShoppingCart size={16} className="text-accent-light" />
          </div>
          <h2 className="font-medium tracking-tight">Carrito</h2>
          <span className="ml-auto badge badge-accent">{cartTotals.itemCount}</span>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-ink-600"
              >
                <ShoppingCart size={28} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Toca un producto para agregar</p>
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-white/[0.04]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.product.nombre}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {formatCurrency(Number(item.product.precio))} × {item.cantidad}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateQty(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors duration-150"
                    >
                      <Minus size={12} />
                    </motion.button>
                    <span className="w-6 text-center text-sm font-mono">{item.cantidad}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateQty(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors duration-150"
                    >
                      <Plus size={12} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-7 h-7 rounded-lg text-neon-red/50 hover:text-neon-red hover:bg-neon-red/8 flex items-center justify-center transition-colors duration-150 ml-1"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  </div>

                  <div className="text-sm font-semibold w-20 text-right font-mono tabular-nums">
                    {formatCurrency(Number(item.product.precio) * item.cantidad)}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer — total & checkout */}
        <div className="p-4 border-t border-white/[0.04] space-y-3 bg-surface-base/60">
          <div className="flex justify-between items-center">
            <span className="text-ink-500 text-sm">Subtotal</span>
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
            Ir al checkout
          </ShineButton>
        </div>
      </div>

      {/* ═══ Modal de Checkout ═══ */}
      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title="Confirmar venta" size="lg">
        <div className="space-y-5">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-ink-300">{item.product.nombre} × {item.cantidad}</span>
                <span className="font-mono tabular-nums">{formatCurrency(Number(item.product.precio) * item.cantidad)}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/[0.04]" />

          <div>
            <label className="text-[11px] text-ink-500 uppercase tracking-[0.12em] font-medium mb-2 block">
              Cliente (opcional)
            </label>
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full">
              <option value="">— Consumidor final —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.documento ? `(${c.documento})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-ink-500 uppercase tracking-[0.12em] font-medium mb-2 block">
              Método de pago
            </label>
            <div className="flex gap-2">
              {[
                { value: 'efectivo', label: 'Efectivo', icon: <Banknote size={14} /> },
                { value: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={14} /> },
                { value: 'transferencia', label: 'Transfer.', icon: <ArrowRight size={14} /> },
              ].map((m) => (
                <motion.button
                  key={m.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMetodoPago(m.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    metodoPago === m.value
                      ? 'bg-accent-500/12 text-accent-light border border-accent-500/25'
                      : 'bg-white/[0.03] text-ink-500 border border-white/[0.04] hover:border-white/[0.1]'
                  )}
                >
                  {m.icon}
                  {m.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-ink-500 uppercase tracking-[0.12em] font-medium mb-2 block">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales para la factura..."
              rows={2}
              className="w-full resize-none"
            />
          </div>

          <div className="h-px bg-white/[0.04]" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold gradient-text bg-gradient-to-r from-accent-500 to-neon-cyan">
              {formatCurrency(cartTotals.subtotal)}
            </span>
          </div>

          <ShineButton
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={processing}
            icon={<CheckCircle size={14} />}
          >
            {processing ? 'Procesando...' : 'Confirmar venta'}
          </ShineButton>
        </div>
      </Modal>

      {/* ═══ Modal de Historial ═══ */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Facturas recientes" size="lg">
        {recentInvoices.length === 0 ? (
          <p className="text-center text-ink-500 py-8">No hay facturas aún</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-card border border-white/[0.04]">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      <DecryptedText text={inv.numero} animateOn="view" speed={40} maxIterations={6} className="text-ink-100" encryptedClassName="text-accent-light opacity-60" />
                    </span>
                    <span className={cn(
                      'badge',
                      inv.estado === 'emitida' && 'badge-cyan',
                      inv.estado === 'pagada' && 'badge-green',
                      inv.estado === 'anulada' && 'badge-red',
                      inv.estado === 'borrador' && 'badge-ghost',
                    )}>
                      {inv.estado}
                    </span>
                  </div>
                  <div className="text-xs text-ink-600 mt-0.5">
                    {inv.cliente_nombre || 'Consumidor final'} · {inv.items_count ?? 0} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold font-mono tabular-nums">{formatCurrency(Number(inv.total))}</div>
                  <div className="text-[10px] text-ink-600">{inv.metodo_pago}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="shimmer-bg animate-shimmer rounded-xl h-24" style={{ opacity: 1 - i * 0.06 }} />
      ))}
    </div>
  );
}
