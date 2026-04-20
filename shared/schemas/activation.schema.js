const { z } = require('zod');

/**
 * Tokens de activación SaaS — 1 mes por defecto.
 * El onboarding combina:
 *   • alta o selección de tenant,
 *   • branding personalizado (nombre empresa, logo, eslogan),
 *   • plantilla inicial (preset_slug) aplicada al tenant,
 *   • plan comercial,
 *   • emisión del token que valida ownership 30 días.
 */
const PLAN_OPTIONS = ['trial', 'starter', 'pro', 'enterprise'];

const brandingSchema = z.object({
  empresa: z.string().min(1).max(160),
  eslogan: z.string().max(240).optional().nullable(),
  logo_url: z.string().url().max(500).optional().nullable(),
  color_primario: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional(),
  color_secundario: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional(),
  website: z.string().url().max(300).optional().nullable(),
  direccion: z.string().max(300).optional().nullable(),
  telefono: z.string().max(60).optional().nullable(),
}).passthrough();

// Opción A: onboarding con tenant existente (por id o slug)
const onboardExistingTenant = z.object({
  tenant_id: z.string().uuid().optional(),
  tenant_slug: z.string().max(60).optional(),
  template_slug: z.string().min(1).max(60),
  branding: brandingSchema,
  plan: z.enum(PLAN_OPTIONS).default('trial'),
  duracion_dias: z.number().int().min(1).max(365).default(30),
}).refine((d) => d.tenant_id || d.tenant_slug, {
  message: 'Debe enviar tenant_id o tenant_slug',
});

// Opción B: onboarding creando un tenant nuevo on-the-fly
const onboardNewTenant = z.object({
  new_tenant: z.object({
    slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    nombre: z.string().min(1).max(120),
    tipo_negocio: z.enum(['papeleria', 'carniceria', 'electronica', 'generico']).default('generico'),
  }),
  template_slug: z.string().min(1).max(60),
  branding: brandingSchema,
  plan: z.enum(PLAN_OPTIONS).default('trial'),
  duracion_dias: z.number().int().min(1).max(365).default(30),
});

function validateOnboard(payload) {
  // Discriminamos por presencia de new_tenant
  if (payload && payload.new_tenant) {
    return { kind: 'new', data: onboardNewTenant.parse(payload) };
  }
  return { kind: 'existing', data: onboardExistingTenant.parse(payload) };
}

const tokenRenew = z.object({
  duracion_dias: z.number().int().min(1).max(365).default(30),
});

module.exports = {
  PLAN_OPTIONS,
  brandingSchema,
  onboardExistingTenant,
  onboardNewTenant,
  tokenRenew,
  validateOnboard,
};
