const invoiceRepo = require('../repositories/invoice.repository');
const { validateInvoice, computeTotals } = require('../../../shared/schemas');

class InvoiceServiceError extends Error {
  constructor(message, { status = 400, code = 'invoice_error', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function list(tenant, opts) {
  return invoiceRepo.listByTenant(tenant.id, opts);
}

async function getById(tenant, id) {
  const inv = await invoiceRepo.findById(tenant.id, id);
  if (!inv) throw new InvoiceServiceError('Factura no encontrada', { status: 404, code: 'not_found' });
  return inv;
}

/**
 * Flujo de creación de factura:
 *   1. Validación Zod (estructura + tipos + reglas de negocio mínimas).
 *   2. Cálculo de totales en el backend (NUNCA confiar en el cliente).
 *   3. Repositorio abre transacción SQL para header + items + stock.
 */
async function create(tenant, payload) {
  let validated;
  try {
    validated = validateInvoice(payload);
  } catch (err) {
    throw new InvoiceServiceError('Factura inválida', {
      status: 422,
      code: 'invalid_invoice',
      details: err.issues || err.message,
    });
  }
  const totals = computeTotals(validated);
  return invoiceRepo.create(tenant.id, validated, totals);
}

async function update(tenant, id, payload) {
  let validated;
  try {
    validated = validateInvoice(payload, { partial: true });
  } catch (err) {
    throw new InvoiceServiceError('Datos inválidos', {
      status: 422,
      code: 'invalid_invoice',
      details: err.issues || err.message,
    });
  }
  const updated = await invoiceRepo.update(tenant.id, id, validated);
  if (!updated) throw new InvoiceServiceError('Factura no encontrada', { status: 404, code: 'not_found' });
  return updated;
}

async function remove(tenant, id) {
  const ok = await invoiceRepo.remove(tenant.id, id);
  if (!ok) throw new InvoiceServiceError('Factura no encontrada', { status: 404, code: 'not_found' });
  return { deleted: true };
}

async function summary(tenant) {
  return invoiceRepo.summary(tenant.id);
}

module.exports = { list, getById, create, update, remove, summary, InvoiceServiceError };
