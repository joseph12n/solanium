const { z } = require('zod');

/**
 * Factura — esquema validado ANTES de abrir transacción SQL.
 * Los totales (subtotal/impuesto_total/total) se recalculan en el
 * service layer a partir de items para evitar que el cliente envíe
 * cifras manipuladas. El schema admite total=0 porque el backend lo
 * sobrescribe.
 */
const invoiceItemInput = z.object({
  product_id: z.string().uuid().optional().nullable(),
  sku: z.string().min(1).max(60),
  nombre: z.string().min(1).max(160),
  unidad: z.string().max(20).default('unidad'),
  cantidad: z.number().positive(),
  precio_unitario: z.number().nonnegative(),
  descuento_unit: z.number().nonnegative().default(0),
  metadata: z.record(z.any()).default({}),
});

const invoiceCreate = z.object({
  numero: z.string().max(40).optional(), // si se omite, backend lo autogenera
  customer_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  estado: z.enum(['borrador', 'emitida', 'pagada', 'anulada']).default('emitida'),
  metodo_pago: z.string().max(40).default('efectivo'),
  moneda: z.string().min(2).max(8).default('USD'),
  impuesto_pct: z.number().min(0).max(100).default(0),
  descuento: z.number().nonnegative().default(0),
  notas: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.any()).default({}),
  items: z.array(invoiceItemInput).min(1, 'La factura debe tener al menos 1 ítem'),
});

const invoiceUpdate = z.object({
  estado: z.enum(['borrador', 'emitida', 'pagada', 'anulada']).optional(),
  metodo_pago: z.string().max(40).optional(),
  notas: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Recalcula totales a partir de items + impuesto_pct + descuento.
 * Redondea a 2 decimales (monetario). Es la única fuente de verdad.
 */
function computeTotals({ items, impuesto_pct = 0, descuento = 0 }) {
  const r2 = (n) => Math.round(n * 100) / 100;
  const subtotal = items.reduce((acc, it) => {
    const linea = (it.precio_unitario - (it.descuento_unit || 0)) * it.cantidad;
    return acc + linea;
  }, 0);
  const baseImponible = Math.max(0, subtotal - descuento);
  const impuesto_total = baseImponible * (impuesto_pct / 100);
  const total = baseImponible + impuesto_total;
  return {
    subtotal: r2(subtotal),
    impuesto_total: r2(impuesto_total),
    total: r2(total),
  };
}

function validateInvoice(payload, { partial = false } = {}) {
  return partial ? invoiceUpdate.parse(payload) : invoiceCreate.parse(payload);
}

module.exports = {
  invoiceItemInput,
  invoiceCreate,
  invoiceUpdate,
  validateInvoice,
  computeTotals,
};
