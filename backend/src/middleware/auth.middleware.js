const activationService = require('../services/activation.service');
const userRepo = require('../repositories/user.repository');

/**
 * Middleware unificado de autenticación.
 *
 * Soporta dos modos, en este orden:
 *   1. Authorization: Bearer <activation_token>
 *        → inyecta req.tenant (desde el token) y req.activation
 *   2. Modo legacy para desarrollo: header x-tenant-id / x-tenant-slug
 *        → compat con tests y frontend actual
 *
 * Además, rutas administrativas pueden requerir:
 *   • x-super-admin-key — clave maestra para bootstrap del SaaS
 *   • token de usuario super_admin (header x-user-id, simplificación demo)
 */
const { query } = require('../config/db');

async function authMiddleware(req, res, next) {
  try {
    const auth = req.header('authorization') || '';
    const bearer = auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : null;

    if (bearer) {
      const activation = await activationService.verify(bearer);
      req.tenant = {
        id: activation.tenant_id,
        slug: activation.tenant_slug,
        nombre: activation.tenant_nombre,
        tipo_negocio: activation.tipo_negocio,
        activo: activation.tenant_activo,
        branding: activation.branding,
        plan: activation.tenant_plan,
      };
      req.activation = {
        id: activation.id,
        expires_at: activation.expires_at,
        plan: activation.plan,
        template_slug: activation.template_slug,
      };
      return next();
    }

    // Fallback legacy por header — útil para el bootstrap y tests locales
    const tenantId = req.header('x-tenant-id');
    const tenantSlug = req.header('x-tenant-slug');
    if (!tenantId && !tenantSlug) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Envía Authorization: Bearer <token> o x-tenant-slug',
      });
    }
    const { rows } = tenantId
      ? await query(
          'SELECT id, slug, nombre, tipo_negocio, activo, settings, branding, plan FROM tenants WHERE id = $1',
          [tenantId]
        )
      : await query(
          'SELECT id, slug, nombre, tipo_negocio, activo, settings, branding, plan FROM tenants WHERE slug = $1',
          [tenantSlug]
        );
    if (rows.length === 0) return res.status(404).json({ error: 'tenant_not_found' });
    if (!rows[0].activo) return res.status(403).json({ error: 'tenant_inactive' });
    req.tenant = rows[0];
    next();
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.code, message: err.message });
    next(err);
  }
}

/**
 * Requiere un super_admin autenticado. Dos vías:
 *   1. Header x-super-admin-key == process.env.SOLANIUM_SUPER_ADMIN_KEY
 *      (bootstrap / máquina a máquina).
 *   2. Header x-user-id con id de un user role=super_admin activo (demo).
 *
 * En producción real, esto sería reemplazado por JWTs firmados.
 */
async function requireSuperAdmin(req, res, next) {
  try {
    const masterKey = process.env.SOLANIUM_SUPER_ADMIN_KEY;
    const providedKey = req.header('x-super-admin-key');
    if (masterKey && providedKey && providedKey === masterKey) {
      req.superAdmin = { id: null, via: 'master_key' };
      return next();
    }

    const userId = req.header('x-user-id');
    if (userId) {
      const u = await userRepo.findById(userId);
      if (u && u.role === 'super_admin' && u.activo && !u.tenant_id) {
        req.superAdmin = { id: u.id, via: 'user' };
        return next();
      }
    }

    return res.status(403).json({
      error: 'forbidden',
      message: 'Se requiere super_admin (header x-super-admin-key o x-user-id de super_admin)',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { authMiddleware, requireSuperAdmin };
