const productRepo = require('../repositories/product.repository');
const { validateProductForTenant } = require('../../../shared/schemas');

class ProductServiceError extends Error {
  constructor(message, { status = 400, code = 'product_error', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function list(tenant, opts) {
  return productRepo.listByTenant(tenant.id, opts);
}

async function getById(tenant, id) {
  const product = await productRepo.findById(tenant.id, id);
  if (!product) {
    throw new ProductServiceError('Producto no encontrado', { status: 404, code: 'not_found' });
  }
  return product;
}

/**
 * Crea un producto validando que los metadatos JSONB cumplan el esquema del
 * `tipo_negocio` del tenant activo.
 */
async function create(tenant, payload) {
  let validated;
  try {
    validated = validateProductForTenant(payload, tenant.tipo_negocio);
  } catch (err) {
    throw new ProductServiceError('Metadatos inválidos para el tipo de negocio', {
      status: 422,
      code: 'invalid_metadata',
      details: err.issues || err.message,
    });
  }
  return productRepo.create(tenant.id, validated);
}

async function update(tenant, id, payload) {
  const existing = await productRepo.findById(tenant.id, id);
  if (!existing) {
    throw new ProductServiceError('Producto no encontrado', { status: 404, code: 'not_found' });
  }
  if (payload.metadata) {
    try {
      const merged = { ...existing, ...payload, metadata: payload.metadata };
      validateProductForTenant(merged, tenant.tipo_negocio);
    } catch (err) {
      throw new ProductServiceError('Metadatos inválidos', {
        status: 422,
        code: 'invalid_metadata',
        details: err.issues || err.message,
      });
    }
  }
  return productRepo.update(tenant.id, id, payload);
}

async function remove(tenant, id) {
  const ok = await productRepo.remove(tenant.id, id);
  if (!ok) {
    throw new ProductServiceError('Producto no encontrado', { status: 404, code: 'not_found' });
  }
  return { deleted: true };
}

module.exports = { list, getById, create, update, remove, ProductServiceError };
