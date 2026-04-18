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

async function update(tenantId, id, data) {
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
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
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

module.exports = { listByTenant, findById, create, update, remove };
