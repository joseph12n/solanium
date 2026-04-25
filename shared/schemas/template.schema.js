const { z } = require('zod');

/**
 * Plantillas — controlan apariencia de la factura Y skin global del app.
 *
 * Campos nuevos (v2) que pintan toda la UI:
 *   • card_style       — bezel / flat / bordered
 *   • button_style     — pill / rounded / sharp
 *   • sidebar_style    — glass / solid / minimal
 *   • typography_scale — compact / default / spacious
 *   • color_primary    — override de --brand-primary
 *   • color_secondary  — override de --brand-secondary
 *   • particle_variant — particles / aurora / none
 *
 * Los presets están agrupados por `tipo_negocio` + `style` para permitir
 * que la UI muestre un "carrusel de presets" por rubro. El slug sigue
 * siendo único global.
 */

const hex = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Color hex inválido');

const themeSchema = z.object({
  // ── Factura (legacy) ──
  accent: hex,
  gradient_from: hex,
  gradient_to: hex,
  font: z.enum(['inter', 'mono', 'serif']).default('inter'),
  layout: z.enum(['modern', 'compact', 'minimal', 'classic']).default('modern'),
  logo_position: z.enum(['left', 'center', 'right']).default('left'),
  logo_url: z.string().url().optional(),
  // ── App-wide skin (v2) ──
  card_style: z.enum(['bezel', 'flat', 'bordered']).default('bezel').optional(),
  button_style: z.enum(['pill', 'rounded', 'sharp']).default('rounded').optional(),
  sidebar_style: z.enum(['glass', 'solid', 'minimal']).default('glass').optional(),
  typography_scale: z.enum(['compact', 'default', 'spacious']).default('default').optional(),
  color_primary: hex.optional(),
  color_secondary: hex.optional(),
  particle_variant: z.enum(['particles', 'aurora', 'none']).default('particles').optional(),
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
 * Presets — 3 por rubro (Minimal / Bold / Vibrant) + 5 universales.
 * Cada uno define `tipo_negocio` (o null = universal) y `style`.
 */
const PRESET_TEMPLATES = [
  // ══════════════════════════════════════════════════════════════════
  //  PAPELERÍA
  // ══════════════════════════════════════════════════════════════════
  {
    slug: 'papeleria-minimal',
    nombre: 'Papelería · Minimal',
    descripcion: 'Blanco, gris y acento índigo. Tipografía clara, cards planas.',
    tipo_negocio: 'papeleria',
    style: 'minimal',
    theme: {
      accent: '#6366f1',
      gradient_from: '#6366f1',
      gradient_to: '#8b5cf6',
      font: 'inter',
      layout: 'minimal',
      logo_position: 'left',
      card_style: 'flat',
      button_style: 'rounded',
      sidebar_style: 'minimal',
      typography_scale: 'default',
      color_primary: '#6366f1',
      color_secondary: '#818cf8',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },
  {
    slug: 'papeleria-bold',
    nombre: 'Papelería · Bold',
    descripcion: 'Índigo profundo + rosa eléctrico. Botones píldora, tipografía grande.',
    tipo_negocio: 'papeleria',
    style: 'bold',
    theme: {
      accent: '#4338ca',
      gradient_from: '#4338ca',
      gradient_to: '#ec4899',
      font: 'inter',
      layout: 'modern',
      logo_position: 'center',
      card_style: 'bezel',
      button_style: 'pill',
      sidebar_style: 'glass',
      typography_scale: 'spacious',
      color_primary: '#4338ca',
      color_secondary: '#ec4899',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'tarjeta', moneda: 'USD', notas: '' },
  },
  {
    slug: 'papeleria-vibrant',
    nombre: 'Papelería · Vibrant',
    descripcion: 'Gradiente arcoíris, aurora animada. Para tiendas modernas.',
    tipo_negocio: 'papeleria',
    style: 'vibrant',
    theme: {
      accent: '#f97316',
      gradient_from: '#f97316',
      gradient_to: '#ec4899',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'pill',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#f97316',
      color_secondary: '#ec4899',
      particle_variant: 'aurora',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },

  // ══════════════════════════════════════════════════════════════════
  //  CARNICERÍA
  // ══════════════════════════════════════════════════════════════════
  {
    slug: 'carniceria-minimal',
    nombre: 'Carnicería · Minimal',
    descripcion: 'Crema + carbón. Serif para la factura, cards planas.',
    tipo_negocio: 'carniceria',
    style: 'minimal',
    theme: {
      accent: '#78350f',
      gradient_from: '#78350f',
      gradient_to: '#44403c',
      font: 'serif',
      layout: 'classic',
      logo_position: 'center',
      card_style: 'flat',
      button_style: 'rounded',
      sidebar_style: 'minimal',
      typography_scale: 'default',
      color_primary: '#b45309',
      color_secondary: '#78350f',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: 'Conservar refrigerado.' },
  },
  {
    slug: 'carniceria-bold',
    nombre: 'Carnicería · Bold',
    descripcion: 'Rojo sangre, esquinas sharp, tipografía pesada.',
    tipo_negocio: 'carniceria',
    style: 'bold',
    theme: {
      accent: '#dc2626',
      gradient_from: '#dc2626',
      gradient_to: '#7f1d1d',
      font: 'inter',
      layout: 'compact',
      logo_position: 'center',
      card_style: 'bordered',
      button_style: 'sharp',
      sidebar_style: 'solid',
      typography_scale: 'spacious',
      color_primary: '#dc2626',
      color_secondary: '#7f1d1d',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: 'Conservar en refrigeración.' },
  },
  {
    slug: 'carniceria-vibrant',
    nombre: 'Carnicería · Vibrant',
    descripcion: 'Gradiente fuego (naranja→rojo), aurora animada, borders glow.',
    tipo_negocio: 'carniceria',
    style: 'vibrant',
    theme: {
      accent: '#f97316',
      gradient_from: '#f97316',
      gradient_to: '#dc2626',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'pill',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#f97316',
      color_secondary: '#dc2626',
      particle_variant: 'aurora',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },

  // ══════════════════════════════════════════════════════════════════
  //  ELECTRÓNICA
  // ══════════════════════════════════════════════════════════════════
  {
    slug: 'electronica-minimal',
    nombre: 'Electrónica · Minimal',
    descripcion: 'Monocromo + cyan eléctrico. Tipografía monoespaciada.',
    tipo_negocio: 'electronica',
    style: 'minimal',
    theme: {
      accent: '#06b6d4',
      gradient_from: '#06b6d4',
      gradient_to: '#0891b2',
      font: 'mono',
      layout: 'minimal',
      logo_position: 'left',
      card_style: 'flat',
      button_style: 'sharp',
      sidebar_style: 'minimal',
      typography_scale: 'compact',
      color_primary: '#06b6d4',
      color_secondary: '#0891b2',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 16, metodo_pago: 'tarjeta', moneda: 'USD', notas: 'Garantía sujeta a serial.' },
  },
  {
    slug: 'electronica-bold',
    nombre: 'Electrónica · Bold',
    descripcion: 'Space negro + electric blue, layout compacto, borders gruesos.',
    tipo_negocio: 'electronica',
    style: 'bold',
    theme: {
      accent: '#3b82f6',
      gradient_from: '#1e40af',
      gradient_to: '#3b82f6',
      font: 'inter',
      layout: 'compact',
      logo_position: 'left',
      card_style: 'bordered',
      button_style: 'sharp',
      sidebar_style: 'solid',
      typography_scale: 'default',
      color_primary: '#3b82f6',
      color_secondary: '#1e40af',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 16, metodo_pago: 'tarjeta', moneda: 'USD', notas: '' },
  },
  {
    slug: 'electronica-vibrant',
    nombre: 'Electrónica · Vibrant',
    descripcion: 'Neon verde + morado eléctrico. Partículas futuristas, botones píldora.',
    tipo_negocio: 'electronica',
    style: 'vibrant',
    theme: {
      accent: '#22c55e',
      gradient_from: '#22c55e',
      gradient_to: '#a855f7',
      font: 'mono',
      layout: 'modern',
      logo_position: 'center',
      card_style: 'bezel',
      button_style: 'pill',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#22c55e',
      color_secondary: '#a855f7',
      particle_variant: 'aurora',
    },
    defaults: { impuesto_pct: 16, metodo_pago: 'tarjeta', moneda: 'USD', notas: '' },
  },

  // ══════════════════════════════════════════════════════════════════
  //  GENÉRICO
  // ══════════════════════════════════════════════════════════════════
  {
    slug: 'generico-minimal',
    nombre: 'Genérico · Minimal',
    descripcion: 'Off-white + neutral gray. Clean sans, sin distracciones.',
    tipo_negocio: 'generico',
    style: 'minimal',
    theme: {
      accent: '#71717a',
      gradient_from: '#71717a',
      gradient_to: '#a1a1aa',
      font: 'inter',
      layout: 'minimal',
      logo_position: 'left',
      card_style: 'flat',
      button_style: 'rounded',
      sidebar_style: 'minimal',
      typography_scale: 'default',
      color_primary: '#52525b',
      color_secondary: '#a1a1aa',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'transferencia', moneda: 'USD', notas: '' },
  },
  {
    slug: 'generico-bold',
    nombre: 'Genérico · Bold',
    descripcion: 'Alto contraste, headings gruesos, sidebar sólido.',
    tipo_negocio: 'generico',
    style: 'bold',
    theme: {
      accent: '#18181b',
      gradient_from: '#18181b',
      gradient_to: '#3f3f46',
      font: 'inter',
      layout: 'modern',
      logo_position: 'center',
      card_style: 'bordered',
      button_style: 'sharp',
      sidebar_style: 'solid',
      typography_scale: 'spacious',
      color_primary: '#18181b',
      color_secondary: '#6366f1',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },
  {
    slug: 'generico-vibrant',
    nombre: 'Genérico · Vibrant',
    descripcion: 'Púrpura aurora, gradientes animados, botones píldora.',
    tipo_negocio: 'generico',
    style: 'vibrant',
    theme: {
      accent: '#a855f7',
      gradient_from: '#a855f7',
      gradient_to: '#22d3ee',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'pill',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#a855f7',
      color_secondary: '#22d3ee',
      particle_variant: 'aurora',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'transferencia', moneda: 'USD', notas: '' },
  },

  // ══════════════════════════════════════════════════════════════════
  //  UNIVERSALES (legacy — siguen disponibles para cualquier rubro)
  // ══════════════════════════════════════════════════════════════════
  {
    slug: 'sunset-classic',
    nombre: 'Sunset Classic',
    descripcion: 'Degradado cálido, ideal para retail.',
    tipo_negocio: null,
    style: 'vibrant',
    theme: {
      accent: '#f97316',
      gradient_from: '#f97316',
      gradient_to: '#ec4899',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'rounded',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#f97316',
      color_secondary: '#ec4899',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },
  {
    slug: 'butcher-bold',
    nombre: 'Butcher Bold',
    descripcion: 'Rojo sangre y crema, tipografía fuerte.',
    tipo_negocio: null,
    style: 'bold',
    theme: {
      accent: '#dc2626',
      gradient_from: '#dc2626',
      gradient_to: '#7f1d1d',
      font: 'inter',
      layout: 'compact',
      logo_position: 'center',
      card_style: 'bezel',
      button_style: 'rounded',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#dc2626',
      color_secondary: '#7f1d1d',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  },
  {
    slug: 'neon-tech',
    nombre: 'Neon Tech',
    descripcion: 'Cian eléctrico, grid futurista.',
    tipo_negocio: null,
    style: 'vibrant',
    theme: {
      accent: '#06b6d4',
      gradient_from: '#06b6d4',
      gradient_to: '#6366f1',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'rounded',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#06b6d4',
      color_secondary: '#6366f1',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 16, metodo_pago: 'tarjeta', moneda: 'USD', notas: '' },
  },
  {
    slug: 'midnight-minimal',
    nombre: 'Midnight Minimal',
    descripcion: 'Negro absoluto con acento violeta. Minimalismo elegante.',
    tipo_negocio: null,
    style: 'minimal',
    theme: {
      accent: '#7c5cff',
      gradient_from: '#7c5cff',
      gradient_to: '#22d3ee',
      font: 'inter',
      layout: 'minimal',
      logo_position: 'right',
      card_style: 'flat',
      button_style: 'rounded',
      sidebar_style: 'minimal',
      typography_scale: 'default',
      color_primary: '#7c5cff',
      color_secondary: '#22d3ee',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'transferencia', moneda: 'USD', notas: '' },
  },
  {
    slug: 'aurora-mint',
    nombre: 'Aurora Mint',
    descripcion: 'Verde aurora con acento frío. Moderno y amigable.',
    tipo_negocio: null,
    style: 'vibrant',
    theme: {
      accent: '#10b981',
      gradient_from: '#10b981',
      gradient_to: '#0ea5e9',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'rounded',
      sidebar_style: 'glass',
      typography_scale: 'default',
      color_primary: '#10b981',
      color_secondary: '#0ea5e9',
      particle_variant: 'aurora',
    },
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
