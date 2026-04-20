const activationRepo = require('../repositories/activation.repository');
const tenantRepo = require('../repositories/tenant.repository');
const {
  validateOnboard,
  tokenRenew,
  PRESET_TEMPLATES,
} = require('../../../shared/schemas');
const { generateToken } = require('../config/crypto');

class ActivationServiceError extends Error {
  constructor(message, { status = 400, code = 'activation_error', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Aplica un preset de plantilla al tenant dentro de la transacción de onboarding.
 * Resuelve el preset shared, upserta la plantilla para el tenant y la marca default.
 */
async function presetApplier(client, tenantId, slug) {
  const preset = PRESET_TEMPLATES.find((p) => p.slug === slug);
  if (!preset) {
    const err = new Error(`Preset no encontrado: ${slug}`);
    err.status = 404;
    err.code = 'preset_not_found';
    throw err;
  }

  // Limpiamos cualquier default previa del tenant para no violar el índice único parcial
  await client.query(
    `UPDATE invoice_templates SET is_default = FALSE
       WHERE tenant_id = $1 AND is_default = TRUE`,
    [tenantId]
  );

  const themeJson = JSON.stringify(preset.theme);
  const defaultsJson = JSON.stringify(preset.defaults);

  const { rows } = await client.query(
    `INSERT INTO invoice_templates
       (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
     VALUES ($1,$2,$3,$4, TRUE, $5::jsonb, $6::jsonb)
     ON CONFLICT (tenant_id, slug) DO UPDATE SET
       nombre      = EXCLUDED.nombre,
       descripcion = EXCLUDED.descripcion,
       is_default  = TRUE,
       theme       = EXCLUDED.theme,
       defaults    = EXCLUDED.defaults
     RETURNING *`,
    [tenantId, preset.slug, preset.nombre, preset.descripcion, themeJson, defaultsJson]
  );
  return rows[0];
}

/**
 * Onboarding: el super-admin entrega plantilla + branding + plan y obtiene
 * a cambio un token Bearer con vigencia configurable (default 30 días).
 */
async function onboard(payload, { emittedBy } = {}) {
  let parsed;
  try {
    parsed = validateOnboard(payload);
  } catch (err) {
    throw new ActivationServiceError('Datos de onboarding inválidos', {
      status: 422, code: 'invalid_onboard', details: err.issues || err.message,
    });
  }

  const { kind, data } = parsed;

  // Resolver tenant
  let tenantRef;
  if (kind === 'new') {
    tenantRef = { new: data.new_tenant };
  } else if (data.tenant_id) {
    const t = await tenantRepo.findById(data.tenant_id);
    if (!t) throw new ActivationServiceError('Tenant no encontrado', { status: 404, code: 'tenant_not_found' });
    tenantRef = { id: t.id };
  } else {
    const t = await tenantRepo.findBySlug(data.tenant_slug);
    if (!t) throw new ActivationServiceError('Tenant no encontrado', { status: 404, code: 'tenant_not_found' });
    tenantRef = { id: t.id };
  }

  const token = generateToken();
  const result = await activationRepo.onboard({
    tenant: tenantRef,
    templateSlug: data.template_slug,
    branding: JSON.stringify(data.branding),
    plan: data.plan,
    duracionDias: data.duracion_dias,
    emittedBy: emittedBy?.id ?? null,
    token,
    presetApplier,
  });

  return {
    ...result,
    token, // devolvemos el token plano UNA sola vez (super-admin debe guardarlo)
  };
}

async function verify(token) {
  const row = await activationRepo.findActiveByToken(token);
  if (!row) throw new ActivationServiceError('Token inválido o expirado', { status: 401, code: 'invalid_token' });
  // Actualizar last_used_at de forma async, no bloqueante
  activationRepo.touchLastUsed(row.id).catch(() => {});
  return row;
}

async function listByTenant(tenant) {
  return activationRepo.listByTenant(tenant.id);
}

async function listAll(opts) {
  return activationRepo.listAll(opts);
}

async function renew(id, payload) {
  let validated;
  try {
    validated = tokenRenew.parse(payload || {});
  } catch (err) {
    throw new ActivationServiceError('Datos inválidos', {
      status: 422, code: 'invalid_renew', details: err.issues || err.message,
    });
  }
  const row = await activationRepo.renew(id, validated.duracion_dias);
  if (!row) throw new ActivationServiceError('Token no encontrado', { status: 404, code: 'not_found' });
  return row;
}

async function revoke(id) {
  const row = await activationRepo.revoke(id);
  if (!row) throw new ActivationServiceError('Token no encontrado o ya revocado', { status: 404, code: 'not_found' });
  return row;
}

module.exports = {
  onboard,
  verify,
  listByTenant,
  listAll,
  renew,
  revoke,
  ActivationServiceError,
};
