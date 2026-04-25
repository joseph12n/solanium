const { z } = require('zod');

/**
 * Tokens de activación SaaS.
 * Al onboarding: tenant + branding + plantilla inicial + plan + tipo de
 * suscripción (monthly/annual). El backend emite:
 *   • session_token — Bearer largo de 30 días (uso API).
 *   • code — 6 dígitos, rota cada 15 min, lo teclea el usuario al entrar.
 */
const PLAN_OPTIONS = ['trial', 'starter', 'pro', 'enterprise'];
const SUBSCRIPTION_TYPES = ['monthly', 'annual'];

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

// Campos comunes a onboarding nuevo / existente
const commonOnboardFields = {
  template_slug: z.string().min(1).max(60),
  branding: brandingSchema,
  plan: z.enum(PLAN_OPTIONS).default('trial'),
  duracion_dias: z.number().int().min(1).max(365).default(30),
  subscription_type: z.enum(SUBSCRIPTION_TYPES).default('monthly'),
};

const onboardExistingTenant = z.object({
  tenant_id: z.string().uuid().optional(),
  tenant_slug: z.string().max(60).optional(),
  ...commonOnboardFields,
}).refine((d) => d.tenant_id || d.tenant_slug, {
  message: 'Debe enviar tenant_id o tenant_slug',
});

const onboardNewTenant = z.object({
  new_tenant: z.object({
    slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    nombre: z.string().min(1).max(120),
    tipo_negocio: z.enum(['papeleria', 'carniceria', 'electronica', 'generico']).default('generico'),
  }),
  ...commonOnboardFields,
});

function validateOnboard(payload) {
  if (payload && payload.new_tenant) {
    return { kind: 'new', data: onboardNewTenant.parse(payload) };
  }
  return { kind: 'existing', data: onboardExistingTenant.parse(payload) };
}

const tokenRenew = z.object({
  duracion_dias: z.number().int().min(1).max(365).default(30),
});

// Schema del input público de /activation/verify (6 dígitos o token largo).
const verifyPayload = z.object({
  code: z.string().trim().min(6).max(128).optional(),
  token: z.string().trim().min(6).max(128).optional(),
}).refine((d) => d.code || d.token, { message: 'Envía code o token' });

module.exports = {
  PLAN_OPTIONS,
  SUBSCRIPTION_TYPES,
  brandingSchema,
  onboardExistingTenant,
  onboardNewTenant,
  tokenRenew,
  verifyPayload,
  validateOnboard,
};
