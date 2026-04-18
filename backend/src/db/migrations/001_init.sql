-- =====================================================================
-- Solanium :: Migración inicial 001_init.sql
-- Postgres 16. Esquema multitenant + JSONB dinámico.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- tenants
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           VARCHAR(60)  NOT NULL UNIQUE,
  nombre         VARCHAR(120) NOT NULL,
  tipo_negocio   VARCHAR(40)  NOT NULL
                 CHECK (tipo_negocio IN ('papeleria','carniceria','electronica','generico')),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  settings       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_tipo ON tenants (tipo_negocio);

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku            VARCHAR(60)  NOT NULL,
  nombre         VARCHAR(160) NOT NULL,
  descripcion    TEXT,
  precio         NUMERIC(14,2) NOT NULL CHECK (precio >= 0),
  stock          NUMERIC(14,3) NOT NULL DEFAULT 0,
  unidad         VARCHAR(20)  NOT NULL DEFAULT 'unidad',
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant       ON products (tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_sku   ON products (tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_metadata_gin ON products USING GIN (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------
-- trigger updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated  ON tenants;
CREATE TRIGGER trg_tenants_updated  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Seed mínimo (idempotente)
-- ---------------------------------------------------------------------
INSERT INTO tenants (slug, nombre, tipo_negocio) VALUES
  ('papeleria-central', 'Papelería Central', 'papeleria'),
  ('carniceria-la-res', 'Carnicería La Res', 'carniceria'),
  ('electro-hub',       'Electro Hub',       'electronica')
ON CONFLICT (slug) DO NOTHING;
