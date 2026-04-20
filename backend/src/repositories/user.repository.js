const { query } = require('../config/db');

/**
 * Devuelve sólo los campos públicos del usuario. Jamás exponer password_hash
 * ni password_salt al exterior (ni siquiera en respuestas al super-admin).
 */
function toSafe(row) {
  if (!row) return null;
  const { password_hash, password_salt, ...safe } = row;
  return safe;
}

async function listByTenant(tenantId, { limit = 50, offset = 0, search } = {}) {
  const params = [tenantId, limit, offset];
  let whereSearch = '';
  if (search) {
    params.push(`%${search}%`);
    whereSearch = ` AND (nombre ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }
  const { rows } = await query(
    `SELECT id, tenant_id, email, nombre, role, activo, last_login_at, metadata, created_at, updated_at
       FROM users
       WHERE tenant_id = $1${whereSearch}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
    params
  );
  return rows.map(toSafe);
}

async function listSuperAdmins() {
  const { rows } = await query(
    `SELECT id, tenant_id, email, nombre, role, activo, last_login_at, metadata, created_at
       FROM users
       WHERE tenant_id IS NULL AND role = 'super_admin'
       ORDER BY created_at ASC`
  );
  return rows.map(toSafe);
}

async function findById(id, { tenantId } = {}) {
  const params = tenantId ? [id, tenantId] : [id];
  const whereTenant = tenantId ? 'AND tenant_id = $2' : '';
  const { rows } = await query(
    `SELECT * FROM users WHERE id = $1 ${whereTenant}`,
    params
  );
  return rows[0] || null;
}

async function findByEmail(email, { tenantId } = {}) {
  if (tenantId) {
    const { rows } = await query(
      `SELECT * FROM users WHERE email = $1 AND tenant_id = $2`,
      [email, tenantId]
    );
    return rows[0] || null;
  }
  const { rows } = await query(
    `SELECT * FROM users WHERE email = $1 AND tenant_id IS NULL`,
    [email]
  );
  return rows[0] || null;
}

async function create({ tenantId, email, nombre, passwordHash, passwordSalt, role, activo, metadata }) {
  const { rows } = await query(
    `INSERT INTO users
       (tenant_id, email, nombre, password_hash, password_salt, role, activo, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      tenantId ?? null,
      email,
      nombre,
      passwordHash,
      passwordSalt,
      role,
      activo ?? true,
      metadata ?? {},
    ]
  );
  return toSafe(rows[0]);
}

async function update(id, data, { tenantId } = {}) {
  const params = [id];
  if (tenantId) params.push(tenantId);

  const whereTenant = tenantId ? `AND tenant_id = $${params.length}` : '';

  const sets = [];
  const add = (col, val) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };

  if (data.email !== undefined) add('email', data.email);
  if (data.nombre !== undefined) add('nombre', data.nombre);
  if (data.role !== undefined) add('role', data.role);
  if (data.activo !== undefined) add('activo', data.activo);
  if (data.metadata !== undefined) add('metadata', JSON.stringify(data.metadata));
  if (data.passwordHash !== undefined) {
    add('password_hash', data.passwordHash);
    add('password_salt', data.passwordSalt);
  }

  if (sets.length === 0) return findById(id, { tenantId });

  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')}
       WHERE id = $1 ${whereTenant}
     RETURNING *`,
    params
  );
  return toSafe(rows[0] || null);
}

async function touchLastLogin(id) {
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [id]);
}

async function remove(id, { tenantId } = {}) {
  const params = tenantId ? [id, tenantId] : [id];
  const whereTenant = tenantId ? 'AND tenant_id = $2' : '';
  const { rowCount } = await query(
    `DELETE FROM users WHERE id = $1 ${whereTenant}`,
    params
  );
  return rowCount > 0;
}

async function countSuperAdmins() {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS c FROM users WHERE tenant_id IS NULL AND role = 'super_admin' AND activo = TRUE`
  );
  return rows[0]?.c || 0;
}

module.exports = {
  toSafe,
  listByTenant,
  listSuperAdmins,
  findById,
  findByEmail,
  create,
  update,
  touchLastLogin,
  remove,
  countSuperAdmins,
};
