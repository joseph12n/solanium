const { z } = require('zod');

const TIPOS_NEGOCIO = ['papeleria', 'carniceria', 'electronica', 'generico'];

// ---------------------------------------------------------------------
// Esquemas de metadatos JSONB — uno por tipo_negocio
// ---------------------------------------------------------------------
const carniceriaMeta = z.object({
  unidad_medida: z.enum(['kg', 'g', 'libra', 'unidad']),
  requiere_refrigeracion: z.boolean(),
  temperatura_min_c: z.number().min(-40).max(20).optional(),
  temperatura_max_c: z.number().min(-40).max(20).optional(),
  fecha_empaque: z.string().date().optional(),
  fecha_vencimiento: z.string().date().optional(),
  proveedor: z.string().min(1).max(120).optional(),
  origen: z.string().min(1).max(80).optional(),
  corte: z.string().min(1).max(80).optional(),
}).strict();

const electronicaMeta = z.object({
  marca: z.string().min(1).max(80),
  modelo: z.string().min(1).max(120),
  serial: z.string().max(120).optional(),
  garantia_meses: z.number().int().min(0).max(120),
  voltaje: z.string().max(20).optional(),
  potencia_w: z.number().positive().optional(),
  color: z.string().max(40).optional(),
}).strict();

const papeleriaMeta = z.object({
  marca: z.string().max(80).optional(),
  presentacion: z.string().min(1).max(80),
  unidades_por_paquete: z.number().int().positive().default(1),
  color: z.string().max(40).optional(),
  material: z.string().max(80).optional(),
}).strict();

const genericoMeta = z.record(z.any());

const METADATA_SCHEMAS = {
  carniceria: carniceriaMeta,
  electronica: electronicaMeta,
  papeleria: papeleriaMeta,
  generico: genericoMeta,
};

// ---------------------------------------------------------------------
// Producto base (campos relacionales)
// ---------------------------------------------------------------------
const baseProduct = z.object({
  sku: z.string().min(1).max(60),
  nombre: z.string().min(1).max(160),
  descripcion: z.string().max(2000).optional(),
  precio: z.number().nonnegative(),
  stock: z.number().nonnegative().default(0),
  unidad: z.string().max(20).default('unidad'),
  activo: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

/**
 * Valida un payload de producto contra el tipo_negocio activo.
 * Devuelve el objeto tipado con metadata validada según el rubro.
 */
function validateProductForTenant(payload, tipoNegocio) {
  if (!TIPOS_NEGOCIO.includes(tipoNegocio)) {
    throw new Error(`tipo_negocio inválido: ${tipoNegocio}`);
  }
  const parsedBase = baseProduct.parse(payload);
  const metaSchema = METADATA_SCHEMAS[tipoNegocio];
  const parsedMeta = metaSchema.parse(parsedBase.metadata ?? {});
  return { ...parsedBase, metadata: parsedMeta };
}

module.exports = {
  TIPOS_NEGOCIO,
  METADATA_SCHEMAS,
  baseProduct,
  validateProductForTenant,
};
