const activationRepo = require('../repositories/activation.repository');
const tenantRepo = require('../repositories/tenant.repository');
const {
  validateOnboard,
  tokenRenew,
  PRESET_TEMPLATES,
} = require('../../../shared/schemas');
const { generateToken, generateCode, isCodeFresh, getCodeTtlMs } = require('../config/crypto');

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
 * a cambio un token Bearer + code de 6 dígitos con vigencia configurable
 * (default 30 días, rotación del code cada 15 min).
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
  const code = generateCode();
  const result = await activationRepo.onboard({
    tenant: tenantRef,
    templateSlug: data.template_slug,
    branding: JSON.stringify(data.branding),
    plan: data.plan,
    duracionDias: data.duracion_dias,
    subscriptionType: data.subscription_type,
    emittedBy: emittedBy?.id ?? null,
    token,
    code,
    presetApplier,
  });

  return { ...result, token, code };
}

/**
 * Rota el código si la ventana de 15 min ya venció. Devuelve la fila ya con
 * datos del tenant listos para el controller.
 */
async function rotateIfStale(row) {
  if (isCodeFresh(row.code_refreshed_at)) return row;
  const fresh = await activationRepo.rotateCode(row.id, generateCode());
  return fresh || row;
}

/**
 * Verificación por code (flujo nuevo, 6 dígitos) o por Bearer token (compat).
 * Acepta cualquiera de los dos y retorna la fila enriquecida con el tenant.
 *
 * Flujo para code:
 *   • Si se encuentra y está fresco → lo retorna tal cual.
 *   • Si se encuentra pero venció la ventana de 15 min → se considera un
 *     intento válido de entrada (el code es no-predecible y está vinculado
 *     al tenant vía UNIQUE), se rota lazy y se retorna la fila con el nuevo
 *     code. Así seguimos la especificación: rotación perezosa "al siguiente
 *     verify", no error duro.
 *   • Si no se encuentra → 401 invalid_code (code jamás emitido o revocado).
 */
async function verify(input) {
  if (!input) throw new ActivationServiceError('Falta el código o token', { status: 400, code: 'missing_credential' });
  const clean = String(input).trim();

  // 6 dígitos numéricos → code
  if (/^\d{6}$/.test(clean)) {
    const row = await activationRepo.findActiveByCode(clean);
    if (!row) throw new ActivationServiceError('Código inválido o expirado', { status: 401, code: 'invalid_code' });
    const fresh = await rotateIfStale(row);
    activationRepo.touchLastUsed(fresh.id).catch(() => {});
    return fresh;
  }

  // Cualquier otra cosa → Bearer token largo (sesión de 30 días).
  const row = await activationRepo.findActiveByToken(clean);
  if (!row) throw new ActivationServiceError('Token inválido o expirado', { status: 401, code: 'invalid_token' });
  activationRepo.touchLastUsed(row.id).catch(() => {});
  return row;
}

/**
 * Devuelve el code vigente de un tenant, rotándolo si venció. Pensado para
 * super-admin: ver el código que debe entregar al cliente en este momento.
 */
async function getCurrentCode({ tenantId, tenantSlug }) {
  let row;
  if (tenantId) row = await activationRepo.findByTenantId(tenantId);
  else if (tenantSlug) row = await activationRepo.findByTenantSlug(tenantSlug);
  if (!row) throw new ActivationServiceError('No hay token activo para el tenant', { status: 404, code: 'no_active_token' });
  const fresh = await rotateIfStale(row);
  return {
    tenant_slug: fresh.tenant_slug,
    tenant_nombre: fresh.tenant_nombre,
    code: fresh.code,
    code_refreshed_at: fresh.code_refreshed_at,
    code_ttl_ms: getCodeTtlMs(),
    expires_at: fresh.expires_at,
    subscription_type: fresh.subscription_type,
    plan: fresh.plan,
  };
}

/**
 * Fuerza rotación inmediata del code (endpoint manual / cron futuro).
 */
async function forceRefreshCode(id) {
  const row = await activationRepo.findById(id);
  if (!row) throw new ActivationServiceError('Token no encontrado', { status: 404, code: 'not_found' });
  const fresh = await activationRepo.rotateCode(id, generateCode());
  return fresh;
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
  getCurrentCode,
  forceRefreshCode,
  listByTenant,
  listAll,
  renew,
  revoke,
  ActivationServiceError,
};
