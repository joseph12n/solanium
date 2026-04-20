const { z } = require('zod');

/**
 * Plantillas de factura — `theme` describe la apariencia y `defaults`
 * los valores pre-rellenados al crear una factura con esta plantilla.
 *
 * Theme es permisivo a propósito: permite que el frontend evolucione
 * (nuevos tokens visuales) sin forzar migraciones DB.
 */
const themeSchema = z.object({
  accent: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Color hex inválido'),
  gradient_from: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/),
  gradient_to: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/),
  font: z.enum(['inter', 'mono', 'serif']).default('inter'),
  layout: z.enum(['modern', 'compact', 'minimal', 'classic']).default('modern'),
  logo_position: z.enum(['left', 'center', 'right']).default('left'),
  logo_url: z.string().url().optional(),
}).passthrough();

const defaultsSchema = z.object({
  impuesto_pct: z.number().min(0).max(100).default(0),
  metodo_pago: z.string().default('efectivo'),
  moneda: z.string().min(2).max(8).default('USD'),
  notas: z.string().max(2000).default(''),
}).passthrough();

const templateBase = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(2000).optional().nullable(),
  is_default: z.boolean().default(false),
  theme: themeSchema,
  defaults: defaultsSchema.default({}),
});

const templateCreate = templateBase;
const templateUpdate = templateBase.partial();

function validateTemplate(payload, { partial = false } = {}) {
  return partial ? templateUpdate.parse(payload) : templateCreate.parse(payload);
}

/**
 * Presets vibrantes disponibles en frontend y backend — sirven como
 * punto de partida para que el usuario "aplique" y personalice.
 */
const PRESET_TEMPLATES = [
  {
    slug: 'sunset-classic',
    nombre: 'Sunset Classic',
    descripcion: 'Degradado cálido, ideal para retail y papelería.',
    theme: { accent: '#f97316', gradient_from: '#f97316', gradient_to: '#ec4899', font: 'inter', layout: 'modern', logo_position: 'left' },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },
  {
    slug: 'butcher-bold',
    nombre: 'Butcher Bold',
    descripcion: 'Rojo sangre y crema, tipografía fuerte para carnicerías.',
    theme: { accent: '#dc2626', gradient_from: '#dc2626', gradient_to: '#7f1d1d', font: 'inter', layout: 'compact', logo_position: 'center' },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: 'Conservar en refrigeración.' },
  },
  {
    slug: 'neon-tech',
    nombre: 'Neon Tech',
    descripcion: 'Cian eléctrico, grid futurista, perfecto para electrónica.',
    theme: { accent: '#06b6d4', gradient_from: '#06b6d4', gradient_to: '#6366f1', font: 'inter', layout: 'modern', logo_position: 'left' },
    defaults: { impuesto_pct: 16, metodo_pago: 'tarjeta', moneda: 'USD', notas: 'Garantía sujeta a serial.' },
  },
  {
    slug: 'midnight-minimal',
    nombre: 'Midnight Minimal',
    descripcion: 'Negro absoluto con acento violeta. Minimalismo elegante.',
    theme: { accent: '#7c5cff', gradient_from: '#7c5cff', gradient_to: '#22d3ee', font: 'inter', layout: 'minimal', logo_position: 'right' },
    defaults: { impuesto_pct: 0, metodo_pago: 'transferencia', moneda: 'USD', notas: '' },
  },
  {
    slug: 'aurora-mint',
    nombre: 'Aurora Mint',
    descripcion: 'Verde aurora con acento frío. Moderno y amigable.',
    theme: { accent: '#10b981', gradient_from: '#10b981', gradient_to: '#0ea5e9', font: 'inter', layout: 'modern', logo_position: 'left' },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },
];

module.exports = {
  themeSchema,
  defaultsSchema,
  templateBase,
  templateCreate,
  templateUpdate,
  validateTemplate,
  PRESET_TEMPLATES,
};
