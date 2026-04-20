const { query, withTransaction } = require('../config/db');

async function findActiveByToken(token) {
  const { rows } = await query(
    `SELECT a.*, t.slug AS tenant_slug, t.nombre AS tenant_nombre,
            t.tipo_negocio, t.activo AS tenant_activo, t.branding, t.plan AS tenant_plan
       FROM activation_tokens a
       JOIN tenants t ON t.id = a.tenant_id
      WHERE a.token = $1
        AND a.revoked_at IS NULL
        AND a.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM activation_tokens WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function listByTenant(tenantId) {
  const { rows } = await query(
    `SELECT * FROM activation_tokens WHERE tenant_id = $1 ORDER BY issued_at DESC`,
    [tenantId]
  );
  return rows;
}

async function listAll({ activeOnly = false } = {}) {
  const filter = activeOnly ? `WHERE revoked_at IS NULL AND expires_at > NOW()` : '';
  const { rows } = await query(
    `SELECT a.*, t.slug AS tenant_slug, t.nombre AS tenant_nombre
       FROM activation_tokens a
       JOIN tenants t ON t.id = a.tenant_id
       ${filter}
       ORDER BY a.issued_at DESC`
  );
  return rows;
}

/**
 * Crea tenant (opcional), aplica branding + plan, vincula plantilla y emite
 * el token de activación. Todo en la misma transacción para garantizar
 * atomicidad: si falla cualquier paso, no quedan tenants a medio aprovisionar.
 */
async function onboard({
  tenant,            // { id } ó { new: { slug, nombre, tipo_negocio } }
  templateSlug,
  branding,
  plan,
  duracionDias,
  emittedBy,
  token,
  presetApplier,     // fn(client, tenantId, slug) -> template row
}) {
  return withTransaction(async (client) => {
    let tenantRow;
    if (tenant.new) {
      const { rows } = await client.query(
        `INSERT INTO tenants (slug, nombre, tipo_negocio, branding, plan)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (slug) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           tipo_negocio = EXCLUDED.tipo_negocio,
           branding = EXCLUDED.branding,
           plan = EXCLUDED.plan
         RETURNING *`,
        [tenant.new.slug, tenant.new.nombre, tenant.new.tipo_negocio, branding, plan]
      );
      tenantRow = rows[0];
    } else {
      const { rows } = await client.query(
        `UPDATE tenants SET branding = $2, plan = $3 WHERE id = $1 RETURNING *`,
        [tenant.id, branding, plan]
      );
      tenantRow = rows[0];
    }
    if (!tenantRow) {
      const err = new Error('Tenant no encontrado');
      err.status = 404;
      err.code = 'tenant_not_found';
      throw err;
    }

    // Aplicar plantilla (preset o existente) + marcar como default
    const template = await presetApplier(client, tenantRow.id, templateSlug);

    // Emitir token con expiración = NOW + duracionDias
    const { rows: tokRows } = await client.query(
      `INSERT INTO activation_tokens
         (tenant_id, token, emitted_by, plan, template_slug, expires_at)
       VALUES ($1,$2,$3,$4,$5, NOW() + ($6 || ' days')::interval)
       RETURNING *`,
      [tenantRow.id, token, emittedBy ?? null, plan, templateSlug, String(duracionDias)]
    );

    return { tenant: tenantRow, template, activation: tokRows[0] };
  });
}

async function renew(id, duracionDias) {
  const { rows } = await query(
    `UPDATE activation_tokens
        SET expires_at = NOW() + ($2 || ' days')::interval,
            revoked_at = NULL
      WHERE id = $1
      RETURNING *`,
    [id, String(duracionDias)]
  );
  return rows[0] || null;
}

async function revoke(id) {
  const { rows } = await query(
    `UPDATE activation_tokens SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

async function touchLastUsed(id) {
  await query(`UPDATE activation_tokens SET last_used_at = NOW() WHERE id = $1`, [id]);
}

module.exports = {
  findActiveByToken,
  findById,
  listByTenant,
  listAll,
  onboard,
  renew,
  revoke,
  touchLastUsed,
};
