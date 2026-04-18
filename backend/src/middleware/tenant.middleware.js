const { query } = require('../config/db');

const CACHE = new Map();
const CACHE_TTL_MS = 60_000;

function getCached(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function setCached(key, value) {
  CACHE.set(key, { value, ts: Date.now() });
}

/**
 * Resuelve tenant desde header `x-tenant-id` (UUID) o `x-tenant-slug`.
 * Inyecta `req.tenant` — obligatorio para todas las rutas de negocio.
 */
async function tenantMiddleware(req, res, next) {
  try {
    const tenantId = req.header('x-tenant-id');
    const tenantSlug = req.header('x-tenant-slug');

    if (!tenantId && !tenantSlug) {
      return res.status(400).json({
        error: 'tenant_required',
        message: 'Debe enviar header x-tenant-id o x-tenant-slug',
      });
    }

    const cacheKey = tenantId || `slug:${tenantSlug}`;
    const cached = getCached(cacheKey);
    if (cached) {
      req.tenant = cached;
      return next();
    }

    const { rows } = tenantId
      ? await query(
          'SELECT id, slug, nombre, tipo_negocio, activo, settings FROM tenants WHERE id = $1',
          [tenantId]
        )
      : await query(
          'SELECT id, slug, nombre, tipo_negocio, activo, settings FROM tenants WHERE slug = $1',
          [tenantSlug]
        );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'tenant_not_found' });
    }
    if (!rows[0].activo) {
      return res.status(403).json({ error: 'tenant_inactive' });
    }

    req.tenant = rows[0];
    setCached(cacheKey, rows[0]);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { tenantMiddleware };
