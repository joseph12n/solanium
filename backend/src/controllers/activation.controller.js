const svc = require('../services/activation.service');

async function onboard(req, res, next) {
  try {
    const data = await svc.onboard(req.body, { emittedBy: req.superAdmin || null });
    res.status(201).json({ data });
  } catch (err) { next(err); }
}

async function listMine(req, res, next) {
  try {
    res.json({ data: await svc.listByTenant(req.tenant) });
  } catch (err) { next(err); }
}

async function listAll(req, res, next) {
  try {
    const activeOnly = req.query.active === 'true';
    res.json({ data: await svc.listAll({ activeOnly }) });
  } catch (err) { next(err); }
}

async function renew(req, res, next) {
  try {
    res.json({ data: await svc.renew(req.params.id, req.body) });
  } catch (err) { next(err); }
}

async function revoke(req, res, next) {
  try {
    res.json({ data: await svc.revoke(req.params.id) });
  } catch (err) { next(err); }
}

/**
 * Verifica un code de 6 dígitos o (retrocompat) un Bearer largo y devuelve
 * el tenant + activation asociados. Es el endpoint que llama el Hero de login.
 */
async function verify(req, res, next) {
  try {
    const input = (req.body?.code || req.body?.token || req.query?.code || req.query?.token || '').trim();
    if (!input) {
      return res.status(400).json({
        error: 'credential_required',
        message: 'Envía { code } (6 dígitos) en el body',
      });
    }
    const row = await svc.verify(input);
    res.json({
      data: {
        valid: true,
        tenant: {
          id: row.tenant_id,
          slug: row.tenant_slug,
          nombre: row.tenant_nombre,
          tipo_negocio: row.tipo_negocio,
          activo: row.tenant_activo,
          branding: row.branding || {},
          plan: row.tenant_plan,
        },
        activation: {
          id: row.id,
          plan: row.plan,
          subscription_type: row.subscription_type,
          template_slug: row.template_slug,
          expires_at: row.expires_at,
          // El Bearer largo se entrega sólo al verificar con code válido.
          // Es lo que el frontend guarda como solanium.token para llamadas API.
          session_token: row.token,
        },
      },
    });
  } catch (err) { next(err); }
}

/**
 * Super-admin: obtener el code vigente de un tenant (rota si venció).
 * Útil en desarrollo para validar vistas sin cron de email.
 */
async function currentCode(req, res, next) {
  try {
    const tenantSlug = req.query.tenant_slug || req.params.slug;
    const tenantId = req.query.tenant_id;
    if (!tenantSlug && !tenantId) {
      return res.status(400).json({ error: 'tenant_required', message: 'Envía tenant_slug o tenant_id' });
    }
    res.json({ data: await svc.getCurrentCode({ tenantId, tenantSlug }) });
  } catch (err) { next(err); }
}

/**
 * Super-admin: fuerza rotación inmediata del code para un token dado.
 */
async function refreshCode(req, res, next) {
  try {
    const row = await svc.forceRefreshCode(req.params.id);
    res.json({
      data: {
        id: row.id,
        code: row.code,
        code_refreshed_at: row.code_refreshed_at,
        tenant_slug: row.tenant_slug,
      },
    });
  } catch (err) { next(err); }
}

module.exports = {
  onboard,
  listMine,
  listAll,
  renew,
  revoke,
  verify,
  currentCode,
  refreshCode,
};
