const customerRepo = require('../repositories/customer.repository');
const { validateCustomer } = require('../../../shared/schemas');

class CustomerServiceError extends Error {
  constructor(message, { status = 400, code = 'customer_error', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function list(tenant, opts) {
  return customerRepo.listByTenant(tenant.id, opts);
}

async function getById(tenant, id) {
  const c = await customerRepo.findById(tenant.id, id);
  if (!c) throw new CustomerServiceError('Cliente no encontrado', { status: 404, code: 'not_found' });
  return c;
}

async function create(tenant, payload) {
  let validated;
  try {
    validated = validateCustomer(payload);
  } catch (err) {
    throw new CustomerServiceError('Datos de cliente inválidos', {
      status: 422,
      code: 'invalid_customer',
      details: err.issues || err.message,
    });
  }
  return customerRepo.create(tenant.id, validated);
}

async function update(tenant, id, payload) {
  let validated;
  try {
    validated = validateCustomer(payload, { partial: true });
  } catch (err) {
    throw new CustomerServiceError('Datos de cliente inválidos', {
      status: 422,
      code: 'invalid_customer',
      details: err.issues || err.message,
    });
  }
  const updated = await customerRepo.update(tenant.id, id, validated);
  if (!updated) throw new CustomerServiceError('Cliente no encontrado', { status: 404, code: 'not_found' });
  return updated;
}

async function remove(tenant, id) {
  const ok = await customerRepo.remove(tenant.id, id);
  if (!ok) throw new CustomerServiceError('Cliente no encontrado', { status: 404, code: 'not_found' });
  return { deleted: true };
}

module.exports = { list, getById, create, update, remove, CustomerServiceError };
