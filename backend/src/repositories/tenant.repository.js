const { query } = require('../config/db');

async function list() {
  const { rows } = await query(
    `SELECT id, slug, nombre, tipo_negocio, activo, settings, metadata, branding, plan, created_at
       FROM tenants
       ORDER BY nombre ASC`
  );
  return rows;
}

async function updateBranding(tenantId, branding) {
  const { rows } = await query(
    `UPDATE tenants SET branding = $2 WHERE id = $1 RETURNING *`,
    [tenantId, JSON.stringify(branding)]
  );
  return rows[0] || null;
}

async function findBySlug(slug) {
  const { rows } = await query('SELECT * FROM tenants WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM tenants WHERE id = $1', [id]);
  return rows[0] || null;
}

module.exports = { list, findBySlug, findById, updateBranding };
