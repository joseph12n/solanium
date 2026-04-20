const { query } = require('../config/db');

/**
 * Todas las consultas están scoped por tenant_id — regla inviolable
 * del sistema multitenant (ver .claudecode.md § REGLAS DE BASE DE DATOS).
 */

async function listByTenant(tenantId, { limit = 50, offset = 0, search } = {}) {
  const params = [tenantId, limit, offset];
  let whereSearch = '';
  if (search) {
    params.push(`%${search}%`);
    whereSearch = ` AND (nombre ILIKE $${params.length} OR documento ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }
  const { rows } = await query(
    `SELECT id, tenant_id, nombre, documento, email, telefono, direccion, activo, metadata, created_at, updated_at
       FROM customers
       WHERE tenant_id = $1${whereSearch}
       ORDER BY nombre ASC
       LIMIT $2 OFFSET $3`,
    params
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await query(
    `SELECT * FROM customers WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

async function create(tenantId, data) {
  const { rows } = await query(
    `INSERT INTO customers
       (tenant_id, nombre, documento, email, telefono, direccion, activo, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      tenantId,
      data.nombre,
      data.documento ?? null,
      data.email ?? null,
      data.telefono ?? null,
      data.direccion ?? null,
      data.activo ?? true,
      data.metadata ?? {},
    ]
  );
  return rows[0];
}

async function update(tenantId, id, data) {
  const { rows } = await query(
    `UPDATE customers SET
       nombre    = COALESCE($3, nombre),
       documento = COALESCE($4, documento),
       email     = COALESCE($5, email),
       telefono  = COALESCE($6, telefono),
       direccion = COALESCE($7, direccion),
       activo    = COALESCE($8, activo),
       metadata  = COALESCE($9, metadata)
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId,
      id,
      data.nombre ?? null,
      data.documento ?? null,
      data.email ?? null,
      data.telefono ?? null,
      data.direccion ?? null,
      data.activo ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
  return rows[0] || null;
}

async function remove(tenantId, id) {
  const { rowCount } = await query(
    `DELETE FROM customers WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rowCount > 0;
}

module.exports = { listByTenant, findById, create, update, remove };
