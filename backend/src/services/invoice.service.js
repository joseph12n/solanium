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

async function markAsPaid(tenant, id) {
  const inv = await invoiceRepo.findById(tenant.id, id);
  if (!inv) throw new InvoiceServiceError('Factura no encontrada', { status: 404, code: 'not_found' });
  if (inv.estado === 'anulada') {
    throw new InvoiceServiceError('No se puede pagar una factura anulada', { status: 409, code: 'invalid_state' });
  }
  return invoiceRepo.update(tenant.id, id, {
    estado: 'pagada',
    metadata: { ...(inv.metadata || {}), paid_at: new Date().toISOString() },
  });
}

/**
 * Placeholder de envío por email — registra el intento en metadata.email_log.
 * En producción se enchufa un transport (SES, Resend, SendGrid, nodemailer).
 */
async function sendEmail(tenant, id, { to } = {}) {
  const inv = await invoiceRepo.findById(tenant.id, id);
  if (!inv) throw new InvoiceServiceError('Factura no encontrada', { status: 404, code: 'not_found' });
  const recipient = to || inv.cliente_email;
  if (!recipient) {
    throw new InvoiceServiceError('Sin destinatario: el cliente no tiene email', {
      status: 422,
      code: 'missing_recipient',
    });
  }
  const log = Array.isArray(inv.metadata?.email_log) ? [...inv.metadata.email_log] : [];
  log.push({ to: recipient, sent_at: new Date().toISOString(), status: 'queued' });
  await invoiceRepo.update(tenant.id, id, {
    metadata: { ...(inv.metadata || {}), email_log: log.slice(-20) },
  });
  return { sent: true, to: recipient, queued_at: log[log.length - 1].sent_at };
}

module.exports = { list, getById, create, update, remove, summary, markAsPaid, sendEmail, InvoiceServiceError };
