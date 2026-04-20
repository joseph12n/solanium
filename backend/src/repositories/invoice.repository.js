const { query, withTransaction } = require('../config/db');

/**
 * Persistencia de facturas. Las operaciones que tocan varias tablas
 * (header + items) se envuelven en withTransaction — regla financiera
 * del .claudecode.md: BEGIN/COMMIT/ROLLBACK obligatorios en ventas.
 */

async function listByTenant(tenantId, { limit = 30, offset = 0, estado, search } = {}) {
  const params = [tenantId, limit, offset];
  const where = [`i.tenant_id = $1`];
  if (estado) {
    params.push(estado);
    where.push(`i.estado = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(i.numero ILIKE $${params.length} OR c.nombre ILIKE $${params.length})`);
  }
  const { rows } = await query(
    `SELECT i.*,
            c.nombre AS cliente_nombre,
            c.documento AS cliente_documento,
            COUNT(ii.id)::int AS items_count
       FROM invoices i
       LEFT JOIN customers c      ON c.id = i.customer_id
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE ${where.join(' AND ')}
       GROUP BY i.id, c.nombre, c.documento
       ORDER BY i.emitida_en DESC
       LIMIT $2 OFFSET $3`,
    params
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await query(
    `SELECT i.*,
            c.nombre AS cliente_nombre,
            c.documento AS cliente_documento,
            c.email AS cliente_email
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE i.tenant_id = $1 AND i.id = $2`,
    [tenantId, id]
  );
  const invoice = rows[0] || null;
  if (!invoice) return null;
  const { rows: items } = await query(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY orden ASC, id ASC`,
    [id]
  );
  invoice.items = items;
  return invoice;
}

/**
 * Correlativo simple por tenant: prefijo F- + zero-padded count+1.
 * Suficiente para demo; un sistema real usaría una secuencia o tabla
 * de series fiscales.
 */
async function nextNumero(client, tenantId) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS c FROM invoices WHERE tenant_id = $1`,
    [tenantId]
  );
  const next = (rows[0]?.c || 0) + 1;
  return `F-${String(next).padStart(6, '0')}`;
}

/**
 * Crea la factura y sus items en una única transacción.
 * `totals` es calculado por el service layer (fuente de verdad).
 */
async function create(tenantId, data, totals) {
  return withTransaction(async (client) => {
    const numero = data.numero || await nextNumero(client, tenantId);

    const { rows: invRows } = await client.query(
      `INSERT INTO invoices
         (tenant_id, numero, customer_id, template_id, estado,
          metodo_pago, moneda, subtotal, impuesto_pct, impuesto_total,
          descuento, total, notas, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        tenantId,
        numero,
        data.customer_id ?? null,
        data.template_id ?? null,
        data.estado ?? 'emitida',
        data.metodo_pago ?? 'efectivo',
        data.moneda ?? 'USD',
        totals.subtotal,
        data.impuesto_pct ?? 0,
        totals.impuesto_total,
        data.descuento ?? 0,
        totals.total,
        data.notas ?? null,
        data.metadata ?? {},
      ]
    );
    const invoice = invRows[0];

    // Items — insertados en el mismo statement multi-values cuando hay varios
    const insertedItems = [];
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      const lineaSubtotal =
        Math.round((it.precio_unitario - (it.descuento_unit || 0)) * it.cantidad * 100) / 100;
      const { rows: itRows } = await client.query(
        `INSERT INTO invoice_items
           (invoice_id, tenant_id, product_id, sku_snapshot, nombre_snapshot,
            unidad_snapshot, cantidad, precio_unitario, descuento_unit,
            subtotal, metadata, orden)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          invoice.id,
          tenantId,
          it.product_id ?? null,
          it.sku,
          it.nombre,
          it.unidad ?? 'unidad',
          it.cantidad,
          it.precio_unitario,
          it.descuento_unit ?? 0,
          lineaSubtotal,
          it.metadata ?? {},
          i,
        ]
      );
      insertedItems.push(itRows[0]);

      // Decrementar stock si el item está linkeado a un producto real.
      // Usamos GREATEST(0, ...) para no bajar negativo en escenarios
      // donde el stock no se trackea estrictamente.
      if (it.product_id) {
        await client.query(
          `UPDATE products
             SET stock = GREATEST(0, stock - $3)
             WHERE tenant_id = $1 AND id = $2`,
          [tenantId, it.product_id, it.cantidad]
        );
      }
    }

    invoice.items = insertedItems;
    return invoice;
  });
}

async function update(tenantId, id, data) {
  const { rows } = await query(
    `UPDATE invoices SET
       estado      = COALESCE($3, estado),
       metodo_pago = COALESCE($4, metodo_pago),
       notas       = COALESCE($5, notas),
       metadata    = COALESCE($6, metadata)
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId,
      id,
      data.estado ?? null,
      data.metodo_pago ?? null,
      data.notas ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
  return rows[0] || null;
}

async function remove(tenantId, id) {
  // ON DELETE CASCADE elimina items automáticamente
  const { rowCount } = await query(
    `DELETE FROM invoices WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rowCount > 0;
}

/**
 * Métricas resumen del dashboard — ventas del día, mes, total, count.
 */
async function summary(tenantId) {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS count_total,
       COALESCE(SUM(total) FILTER (WHERE estado <> 'anulada'), 0)::numeric AS ingresos_total,
       COALESCE(SUM(total) FILTER (WHERE estado <> 'anulada' AND emitida_en >= CURRENT_DATE), 0)::numeric AS ingresos_hoy,
       COALESCE(SUM(total) FILTER (WHERE estado <> 'anulada' AND emitida_en >= DATE_TRUNC('month', CURRENT_DATE)), 0)::numeric AS ingresos_mes,
       COUNT(*) FILTER (WHERE emitida_en >= CURRENT_DATE)::int AS count_hoy
     FROM invoices
     WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows[0];
}

module.exports = { listByTenant, findById, create, update, remove, summary };
