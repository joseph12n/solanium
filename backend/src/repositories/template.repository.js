const { query, withTransaction } = require('../config/db');

async function listByTenant(tenantId) {
  const { rows } = await query(
    `SELECT * FROM invoice_templates WHERE tenant_id = $1 ORDER BY is_default DESC, nombre ASC`,
    [tenantId]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await query(
    `SELECT * FROM invoice_templates WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

async function findDefault(tenantId) {
  const { rows } = await query(
    `SELECT * FROM invoice_templates WHERE tenant_id = $1 AND is_default = TRUE LIMIT 1`,
    [tenantId]
  );
  return rows[0] || null;
}

async function create(tenantId, data) {
  // Si la plantilla nueva se marca como default, usamos una transacción
  // para desmarcar la anterior default y evitar violar el índice único.
  return withTransaction(async (client) => {
    if (data.is_default) {
      await client.query(
        `UPDATE invoice_templates SET is_default = FALSE WHERE tenant_id = $1 AND is_default = TRUE`,
        [tenantId]
      );
    }
    const { rows } = await client.query(
      `INSERT INTO invoice_templates (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        tenantId,
        data.slug,
        data.nombre,
        data.descripcion ?? null,
        data.is_default ?? false,
        data.theme ?? {},
        data.defaults ?? {},
      ]
    );
    return rows[0];
  });
}

async function update(tenantId, id, data) {
  return withTransaction(async (client) => {
    if (data.is_default === true) {
      await client.query(
        `UPDATE invoice_templates SET is_default = FALSE WHERE tenant_id = $1 AND is_default = TRUE AND id <> $2`,
        [tenantId, id]
      );
    }
    const { rows } = await client.query(
      `UPDATE invoice_templates SET
         slug        = COALESCE($3, slug),
         nombre      = COALESCE($4, nombre),
         descripcion = COALESCE($5, descripcion),
         is_default  = COALESCE($6, is_default),
         theme       = COALESCE($7, theme),
         defaults    = COALESCE($8, defaults)
       WHERE tenant_id = $1 AND id = $2
       RETURNING *`,
      [
        tenantId,
        id,
        data.slug ?? null,
        data.nombre ?? null,
        data.descripcion ?? null,
        typeof data.is_default === 'boolean' ? data.is_default : null,
        data.theme ? JSON.stringify(data.theme) : null,
        data.defaults ? JSON.stringify(data.defaults) : null,
      ]
    );
    return rows[0] || null;
  });
}

async function remove(tenantId, id) {
  const { rowCount } = await query(
    `DELETE FROM invoice_templates WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rowCount > 0;
}

module.exports = { listByTenant, findById, findDefault, create, update, remove };
