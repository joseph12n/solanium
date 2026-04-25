const activationService = require('../services/activation.service');
const userRepo = require('../repositories/user.repository');

/**
 * Middleware unificado de autenticación.
 *
 * Canónico: Authorization: Bearer <session_token>
 *   → el session_token viene de POST /api/activation/verify y es el mismo
 *     token opaco que vive en activation_tokens.token (64 hex, 30 días).
 *   → inyecta req.tenant (derivado del token) y req.activation.
 *
 * Ya NO se acepta x-tenant-slug (legacy removido — CLAUDE.md).
 *
 * Rutas de super-admin requieren además:
 *   • x-super-admin-key (maestro, M2M/bootstrap), o
 *   • x-user-id con id de user role=super_admin activo.
 */
async function authMiddleware(req, res, next) {
  try {
    const auth = req.header('authorization') || '';
    const bearer = auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : null;

    if (!bearer) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Envía Authorization: Bearer <session_token>',
      });
    }

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
      subscription_type: activation.subscription_type,
      template_slug: activation.template_slug,
    };

    const userId = req.header('x-user-id');
    if (userId) {
      const u = await userRepo.findById(userId);
      if (u && u.activo && u.tenant_id === req.tenant.id) {
        req.user = { id: u.id, role: u.role, email: u.email, nombre: u.nombre };
      }
    }
    return next();
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
 * En producción esto se reemplazará por JWTs firmados.
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
