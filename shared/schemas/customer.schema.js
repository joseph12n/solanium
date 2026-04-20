const { z } = require('zod');

/**
 * Cliente — modelo relacional simple + metadata JSONB libre
 * (campos fiscales varían por país: RUC, CUIT, NIT, DNI, etc.).
 *
 * La metadata es abierta porque cada tenant puede necesitar campos
 * distintos (ej: electrónica guarda "historial_compras", carnicería
 * guarda "preferencia_corte").
 */
const customerBase = z.object({
  nombre: z.string().min(1).max(160),
  documento: z.string().max(40).optional().nullable(),
  email: z.string().email().max(160).optional().nullable(),
  telefono: z.string().max(40).optional().nullable(),
  direccion: z.string().max(500).optional().nullable(),
  activo: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

const customerCreate = customerBase;
const customerUpdate = customerBase.partial();

function validateCustomer(payload, { partial = false } = {}) {
  return partial ? customerUpdate.parse(payload) : customerCreate.parse(payload);
}

module.exports = {
  customerBase,
  customerCreate,
  customerUpdate,
  validateCustomer,
};
