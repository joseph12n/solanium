const { query, withTransaction } = require('../config/db');

/**
 * SELECT base reutilizable: todos los datos del token + tenant necesarios
 * para inyectar req.tenant y req.activation en el middleware de auth.
 */
const TOKEN_JOIN_SELECT = `
  SELECT a.*,
         t.slug         AS tenant_slug,
         t.nombre       AS tenant_nombre,
         t.tipo_negocio,
         t.activo       AS tenant_activo,
         t.branding,
         t.plan         AS tenant_plan
    FROM activation_tokens a
    JOIN tenants t ON t.id = a.tenant_id`;

async function findActiveByToken(token) {
  const { rows } = await query(
    `${TOKEN_JOIN_SELECT}
     WHERE a.token = $1
       AND a.revoked_at IS NULL
       AND a.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

async function findActiveByCode(code) {
  const { rows } = await query(
    `${TOKEN_JOIN_SELECT}
     WHERE a.code = $1
       AND a.revoked_at IS NULL
       AND a.expires_at > NOW()`,
    [code]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM activation_tokens WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByTenantId(tenantId) {
  const { rows } = await query(
    `${TOKEN_JOIN_SELECT}
     WHERE a.tenant_id = $1
       AND a.revoked_at IS NULL
       AND a.expires_at > NOW()
     ORDER BY a.issued_at DESC
     LIMIT 1`,
    [tenantId]
  );
  return rows[0] || null;
}

async function findByTenantSlug(slug) {
  const { rows } = await query(
    `${TOKEN_JOIN_SELECT}
     WHERE t.slug = $1
       AND a.revoked_at IS NULL
       AND a.expires_at > NOW()
     ORDER BY a.issued_at DESC
     LIMIT 1`,
    [slug]
  );
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
  const filter = activeOnly ? `WHERE a.revoked_at IS NULL AND a.expires_at > NOW()` : '';
  const { rows } = await query(
    `${TOKEN_JOIN_SELECT}
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
  tenant,             // { id } ó { new: { slug, nombre, tipo_negocio } }
  templateSlug,
  branding,
  plan,
  duracionDias,
  subscriptionType,   // 'monthly' | 'annual'
  emittedBy,
  token,
  code,
  presetApplier,      // fn(client, tenantId, slug) -> template row
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
    // code_refreshed_at=NOW() marca el inicio de la ventana de 15 min.
    const { rows: tokRows } = await client.query(
      `INSERT INTO activation_tokens
         (tenant_id, token, code, code_refreshed_at, emitted_by,
          plan, subscription_type, template_slug, expires_at)
       VALUES ($1,$2,$3,NOW(),$4,$5,$6,$7, NOW() + ($8 || ' days')::interval)
       RETURNING *`,
      [
        tenantRow.id,
        token,
        code,
        emittedBy ?? null,
        plan,
        subscriptionType,
        templateSlug,
        String(duracionDias),
      ]
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

/**
 * Actualiza el código de activación (rotación periódica cada 15 min).
 * Devuelve la fila ya con el tenant joined para que el caller pueda responder
 * sin una segunda consulta.
 */
async function rotateCode(id, newCode) {
  const { rows } = await query(
    `WITH updated AS (
       UPDATE activation_tokens
          SET code = $2, code_refreshed_at = NOW()
        WHERE id = $1
        RETURNING *
     )
     SELECT u.*,
            t.slug AS tenant_slug, t.nombre AS tenant_nombre,
            t.tipo_negocio, t.activo AS tenant_activo,
            t.branding, t.plan AS tenant_plan
       FROM updated u
       JOIN tenants t ON t.id = u.tenant_id`,
    [id, newCode]
  );
  return rows[0] || null;
}

module.exports = {
  findActiveByToken,
  findActiveByCode,
  findById,
  findByTenantId,
  findByTenantSlug,
  listByTenant,
  listAll,
  onboard,
  renew,
  revoke,
  touchLastUsed,
  rotateCode,
};
