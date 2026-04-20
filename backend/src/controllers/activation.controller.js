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

async function verify(req, res, next) {
  try {
    const token = (req.body?.token || req.query?.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'token_required', message: 'Envía { token } en el body o ?token=' });
    }
    const row = await svc.verify(token);
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
          template_slug: row.template_slug,
          expires_at: row.expires_at,
        },
      },
    });
  } catch (err) { next(err); }
}

module.exports = { onboard, listMine, listAll, renew, revoke, verify };
