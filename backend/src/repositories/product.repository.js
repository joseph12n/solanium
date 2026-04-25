const { query } = require('../config/db');

async function listByTenant(tenantId, { limit = 50, offset = 0, search } = {}) {
  const params = [tenantId, limit, offset];
  let whereSearch = '';
  if (search) {
    params.push(`%${search}%`);
    whereSearch = ` AND (nombre ILIKE $${params.length} OR sku ILIKE $${params.length})`;
  }
  const { rows } = await query(
    `SELECT id, tenant_id, sku, nombre, descripcion, precio, stock, unidad, activo, metadata, created_at, updated_at
       FROM products
       WHERE tenant_id = $1${whereSearch}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
    params
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await query(
    `SELECT * FROM products WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

async function create(tenantId, data) {
  const { rows } = await query(
    `INSERT INTO products
       (tenant_id, sku, nombre, descripcion, precio, stock, unidad, activo, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      tenantId,
      data.sku,
      data.nombre,
      data.descripcion ?? null,
      data.precio,
      data.stock ?? 0,
      data.unidad ?? 'unidad',
      data.activo ?? true,
      data.metadata ?? {},
    ]
  );
  return rows[0];
}

async function update(tenantId, id, data, { changedBy = null } = {}) {
  const current = await findById(tenantId, id);
  if (!current) return null;

  const priceChanged =
    data.precio !== undefined &&
    data.precio !== null &&
    Number(data.precio) !== Number(current.precio);

  let mergedMetadata = data.metadata
    ? { ...(current.metadata || {}), ...data.metadata }
    : null;

  if (priceChanged) {
    const base = mergedMetadata || { ...(current.metadata || {}) };
    const history = Array.isArray(base.price_history) ? [...base.price_history] : [];
    history.push({
      price: Number(current.precio),
      changed_at: new Date().toISOString(),
      changed_by: changedBy,
    });
    base.price_history = history.slice(-50);
    mergedMetadata = base;
  }

  const { rows } = await query(
    `UPDATE products SET
       nombre      = COALESCE($3, nombre),
       descripcion = COALESCE($4, descripcion),
       precio      = COALESCE($5, precio),
       stock       = COALESCE($6, stock),
       unidad      = COALESCE($7, unidad),
       activo      = COALESCE($8, activo),
       metadata    = COALESCE($9, metadata)
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId,
      id,
      data.nombre ?? null,
      data.descripcion ?? null,
      data.precio ?? null,
      data.stock ?? null,
      data.unidad ?? null,
      data.activo ?? null,
      mergedMetadata ? JSON.stringify(mergedMetadata) : null,
    ]
  );
  return rows[0] || null;
}

async function adjustStock(tenantId, id, delta, { reason = null, changedBy = null } = {}) {
  const current = await findById(tenantId, id);
  if (!current) return null;

  const nextStock = Number(current.stock || 0) + Number(delta);
  const base = { ...(current.metadata || {}) };
  const movements = Array.isArray(base.stock_movements) ? [...base.stock_movements] : [];
  movements.push({
    delta: Number(delta),
    new_stock: nextStock,
    reason,
    changed_at: new Date().toISOString(),
    changed_by: changedBy,
  });
  base.stock_movements = movements.slice(-100);

  const { rows } = await query(
    `UPDATE products SET stock = $3, metadata = $4
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [tenantId, id, nextStock, JSON.stringify(base)]
  );
  return rows[0] || null;
}

async function remove(tenantId, id) {
  const { rowCount } = await query(
    `DELETE FROM products WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rowCount > 0;
}

module.exports = { listByTenant, findById, create, update, adjustStock, remove };
