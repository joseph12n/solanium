const { z } = require('zod');

/**
 * Usuarios del SaaS.
 *   super_admin — gestiona la plataforma (tenant_id nulo).
 *   admin / operador / solo_lectura — pertenecen a un tenant.
 *
 * El password viaja en claro sólo en create/login; el servicio lo hashea
 * con scrypt antes de persistir. Nunca se devuelve password_hash en la
 * respuesta (ver user.repository toSafe()).
 */
const USER_ROLES = ['super_admin', 'admin', 'operador', 'solo_lectura'];

const userCreate = z.object({
  email: z.string().email().max(200),
  nombre: z.string().min(1).max(160),
  password: z.string().min(8).max(200),
  role: z.enum(USER_ROLES).default('operador'),
  activo: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

const userUpdate = z.object({
  email: z.string().email().max(200).optional(),
  nombre: z.string().min(1).max(160).optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(USER_ROLES).optional(),
  activo: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const userLogin = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  tenant_slug: z.string().max(60).optional(), // requerido para login de usuarios de tenant
});

function validateUser(payload, { partial = false } = {}) {
  return partial ? userUpdate.parse(payload) : userCreate.parse(payload);
}

function validateUserLogin(payload) {
  return userLogin.parse(payload);
}

module.exports = {
  USER_ROLES,
  userCreate,
  userUpdate,
  userLogin,
  validateUser,
  validateUserLogin,
};
