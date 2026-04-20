-- =====================================================================
-- Solanium :: Migración 003_users_activation.sql
-- Capa SaaS: usuarios, super-admin y tokens de activación de 1 mes.
--
-- Diseño:
--   • users.role ∈ {super_admin, admin, operador, solo_lectura}
--     - super_admin NO pertenece a un tenant (tenant_id NULL) — gestiona
--       la plataforma completa (emite tokens, crea tenants, asigna plantillas).
--     - Los demás roles SIEMPRE pertenecen a un tenant.
--   • activation_tokens: token único que otorga acceso al sistema por
--     1 mes (30 días). Cada token se asocia a un tenant y al super-admin
--     que lo emitió. Puede revocarse (revoked_at) o extenderse renovando.
--   • tenants.branding: JSONB con personalización visual del cliente
--     (nombre_empresa, logo_url, colores_override, eslogan, etc.).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extender tenants con branding personalizable por cliente SaaS
-- ---------------------------------------------------------------------
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan VARCHAR(40) NOT NULL DEFAULT 'trial';

-- ---------------------------------------------------------------------
-- users — cuenta de acceso. Multitenant o global (super_admin).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         REFERENCES tenants(id) ON DELETE CASCADE,
  email          VARCHAR(200) NOT NULL,
  nombre         VARCHAR(160) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  password_salt  VARCHAR(64)  NOT NULL,
  role           VARCHAR(30)  NOT NULL DEFAULT 'operador'
                 CHECK (role IN ('super_admin','admin','operador','solo_lectura')),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Email único: global para super_admin (tenant_id NULL), por tenant para el resto.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_global
  ON users (email) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_tenant
  ON users (tenant_id, email) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);

DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- activation_tokens — licencia SaaS de 1 mes por tenant.
--   • token: string opaco (64 hex) que viaja en Authorization: Bearer
--   • emitted_by: super_admin que emitió la licencia
--   • expires_at: emisión + 30 días (calculado en backend, no trigger)
--   • revoked_at: NULL mientras el token sea válido
--   • plan: etiqueta comercial (trial/starter/pro/enterprise)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activation_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token          VARCHAR(128) NOT NULL UNIQUE,
  emitted_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
  plan           VARCHAR(40)  NOT NULL DEFAULT 'trial',
  template_slug  VARCHAR(60),                          -- plantilla elegida al onboarding
  issued_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ  NOT NULL,
  revoked_at     TIMESTAMPTZ,
  last_used_at   TIMESTAMPTZ,
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_tenant   ON activation_tokens (tenant_id);
CREATE INDEX IF NOT EXISTS idx_activation_expires  ON activation_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_active
  ON activation_tokens (token) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------
-- Seed: super-admin por defecto para bootstrap del SaaS.
-- Password inicial: "solanium-super-2026" (hash scrypt pregenerado abajo).
-- Al iniciar, super-admin debe cambiar la contraseña con PATCH /api/users/:id.
-- ---------------------------------------------------------------------
-- Nota: se inserta SÓLO si no existe ningún super_admin aún.
-- El hash real se inyecta en runtime desde el script de seed (evita
-- hardcodear credenciales en SQL). Aquí se crea un placeholder seguro:
-- la aplicación al arrancar verifica si hay super_admin y lo crea si falta.

-- (No seed SQL directo — el bootstrap lo realiza el backend al primer arranque)
