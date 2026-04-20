const userRepo = require('../repositories/user.repository');
const tenantRepo = require('../repositories/tenant.repository');
const { validateUser, validateUserLogin } = require('../../../shared/schemas');
const { hashPassword, verifyPassword } = require('../config/crypto');

class UserServiceError extends Error {
  constructor(message, { status = 400, code = 'user_error', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * List/show sólo aplican al scope del tenant actual. Los super_admins
 * aparecen en otro endpoint (listSuperAdmins) — el tenant nunca los ve.
 */
async function list(tenant, opts) {
  return userRepo.listByTenant(tenant.id, opts);
}

async function getById(tenant, id) {
  const u = await userRepo.findById(id, { tenantId: tenant.id });
  if (!u) throw new UserServiceError('Usuario no encontrado', { status: 404, code: 'not_found' });
  return userRepo.toSafe(u);
}

/**
 * Crear usuario dentro del tenant actual (admin invita a su equipo).
 * No puede crear super_admin por esta vía: esa promoción la hace el
 * super_admin global vía createSuperAdmin().
 */
async function create(tenant, payload) {
  let validated;
  try {
    validated = validateUser(payload);
  } catch (err) {
    throw new UserServiceError('Datos de usuario inválidos', {
      status: 422, code: 'invalid_user', details: err.issues || err.message,
    });
  }
  if (validated.role === 'super_admin') {
    throw new UserServiceError('No se puede crear super_admin desde un tenant', {
      status: 403, code: 'forbidden_role',
    });
  }

  const existing = await userRepo.findByEmail(validated.email, { tenantId: tenant.id });
  if (existing) {
    throw new UserServiceError('El email ya está en uso en este tenant', {
      status: 409, code: 'email_taken',
    });
  }

  const { hash, salt } = await hashPassword(validated.password);
  return userRepo.create({
    tenantId: tenant.id,
    email: validated.email,
    nombre: validated.nombre,
    passwordHash: hash,
    passwordSalt: salt,
    role: validated.role,
    activo: validated.activo,
    metadata: validated.metadata,
  });
}

/**
 * Crea un super_admin global. Sólo puede llamarlo:
 *   - otro super_admin autenticado, o
 *   - el bootstrap inicial (si no existe ningún super_admin todavía).
 */
async function createSuperAdmin(payload, { bootstrap = false, calledBy } = {}) {
  let validated;
  try {
    validated = validateUser({ ...payload, role: 'super_admin' });
  } catch (err) {
    throw new UserServiceError('Datos de super-admin inválidos', {
      status: 422, code: 'invalid_user', details: err.issues || err.message,
    });
  }

  if (!bootstrap) {
    if (!calledBy || calledBy.role !== 'super_admin') {
      throw new UserServiceError('Sólo otro super_admin puede crear super_admins', {
        status: 403, code: 'forbidden',
      });
    }
  } else {
    const count = await userRepo.countSuperAdmins();
    if (count > 0) {
      throw new UserServiceError('Ya existe un super_admin — use un token autenticado', {
        status: 409, code: 'bootstrap_closed',
      });
    }
  }

  const existing = await userRepo.findByEmail(validated.email);
  if (existing) {
    throw new UserServiceError('Email de super_admin ya registrado', {
      status: 409, code: 'email_taken',
    });
  }

  const { hash, salt } = await hashPassword(validated.password);
  return userRepo.create({
    tenantId: null,
    email: validated.email,
    nombre: validated.nombre,
    passwordHash: hash,
    passwordSalt: salt,
    role: 'super_admin',
    activo: true,
    metadata: validated.metadata,
  });
}

async function update(tenant, id, payload) {
  let validated;
  try {
    validated = validateUser(payload, { partial: true });
  } catch (err) {
    throw new UserServiceError('Datos inválidos', {
      status: 422, code: 'invalid_user', details: err.issues || err.message,
    });
  }
  if (validated.role === 'super_admin') {
    throw new UserServiceError('No se puede promover a super_admin desde un tenant', {
      status: 403, code: 'forbidden_role',
    });
  }

  const patch = { ...validated };
  if (validated.password) {
    const { hash, salt } = await hashPassword(validated.password);
    patch.passwordHash = hash;
    patch.passwordSalt = salt;
    delete patch.password;
  }
  const updated = await userRepo.update(id, patch, { tenantId: tenant.id });
  if (!updated) throw new UserServiceError('Usuario no encontrado', { status: 404, code: 'not_found' });
  return userRepo.toSafe(updated);
}

async function remove(tenant, id) {
  const ok = await userRepo.remove(id, { tenantId: tenant.id });
  if (!ok) throw new UserServiceError('Usuario no encontrado', { status: 404, code: 'not_found' });
  return { deleted: true };
}

/**
 * Login:
 *   - Si payload.tenant_slug presente: busca usuario dentro de ese tenant.
 *   - Si no: intenta login como super_admin global.
 */
async function login(payload) {
  let validated;
  try {
    validated = validateUserLogin(payload);
  } catch (err) {
    throw new UserServiceError('Credenciales inválidas', {
      status: 422, code: 'invalid_login', details: err.issues || err.message,
    });
  }

  let user;
  let tenant = null;
  if (validated.tenant_slug) {
    tenant = await tenantRepo.findBySlug(validated.tenant_slug);
    if (!tenant) throw new UserServiceError('Tenant no existe', { status: 404, code: 'tenant_not_found' });
    user = await userRepo.findByEmail(validated.email, { tenantId: tenant.id });
  } else {
    user = await userRepo.findByEmail(validated.email);
  }

  if (!user || !user.activo) {
    throw new UserServiceError('Credenciales incorrectas', { status: 401, code: 'unauthorized' });
  }
  const ok = await verifyPassword(validated.password, user.password_hash, user.password_salt);
  if (!ok) {
    throw new UserServiceError('Credenciales incorrectas', { status: 401, code: 'unauthorized' });
  }

  await userRepo.touchLastLogin(user.id);
  return { user: userRepo.toSafe(user), tenant };
}

module.exports = {
  list,
  getById,
  create,
  createSuperAdmin,
  update,
  remove,
  login,
  UserServiceError,
};
