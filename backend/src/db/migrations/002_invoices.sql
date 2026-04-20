-- =====================================================================
-- Solanium :: Migración 002_invoices.sql
-- Módulo de Facturación + Clientes + Plantillas configurables.
--
-- Diseño clave:
--   • Todo multitenant (tenant_id FK en cada tabla de negocio).
--   • Metadatos dinámicos vía columna JSONB para permitir personalización
--     por rubro sin alterar el esquema.
--   • Integridad financiera: los items de factura se insertan dentro de
--     la misma transacción SQL que el header (ver service layer).
--   • Las plantillas (invoice_templates) guardan una "theme" JSONB que
--     el frontend interpreta (colores, logo, layout, campos visibles).
-- =====================================================================

-- ---------------------------------------------------------------------
-- customers — Clientes por tenant. Metadata libre (CUIT, RUC, NIT, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre         VARCHAR(160) NOT NULL,
  documento      VARCHAR(40),                         -- DNI/RUC/CUIT/NIT
  email          VARCHAR(160),
  telefono       VARCHAR(40),
  direccion      TEXT,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, documento)                        -- único por tenant
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant       ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_nom   ON customers (tenant_id, nombre);
CREATE INDEX IF NOT EXISTS idx_customers_metadata_gin ON customers USING GIN (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------
-- invoice_templates — Plantillas visuales reutilizables.
--   theme: { accent, gradient_from, gradient_to, font, layout, logo_url, ... }
--   defaults: valores por defecto aplicados al crear una factura con esta plantilla
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug           VARCHAR(60)  NOT NULL,
  nombre         VARCHAR(120) NOT NULL,
  descripcion    TEXT,
  is_default     BOOLEAN      NOT NULL DEFAULT FALSE,
  theme          JSONB        NOT NULL DEFAULT '{}'::jsonb,
  defaults       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_templates_tenant ON invoice_templates (tenant_id);
-- Solo una plantilla default por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_one_default
  ON invoice_templates (tenant_id) WHERE is_default = TRUE;

-- ---------------------------------------------------------------------
-- invoices — Header de la factura. Estado financiero y totales precomputados.
--   estado: borrador | emitida | pagada | anulada
--   metadata: campos dinámicos (observaciones, canal de venta, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero         VARCHAR(40)  NOT NULL,                -- correlativo por tenant
  customer_id    UUID         REFERENCES customers(id) ON DELETE SET NULL,
  template_id   UUID          REFERENCES invoice_templates(id) ON DELETE SET NULL,
  estado         VARCHAR(20)  NOT NULL DEFAULT 'emitida'
                 CHECK (estado IN ('borrador','emitida','pagada','anulada')),
  metodo_pago    VARCHAR(40)  NOT NULL DEFAULT 'efectivo',
  moneda         VARCHAR(8)   NOT NULL DEFAULT 'USD',
  subtotal       NUMERIC(14,2) NOT NULL DEFAULT 0,
  impuesto_pct   NUMERIC(6,3)  NOT NULL DEFAULT 0,
  impuesto_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento      NUMERIC(14,2) NOT NULL DEFAULT 0,
  total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  notas          TEXT,
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  emitida_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant         ON invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_fecha   ON invoices (tenant_id, emitida_en DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_estado  ON invoices (tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_invoices_customer       ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_metadata_gin   ON invoices USING GIN (metadata jsonb_path_ops);

-- ---------------------------------------------------------------------
-- invoice_items — Líneas de detalle. SNAPSHOT del producto al momento
--   de la venta (congelamos nombre/precio/unidad para que ediciones
--   posteriores al producto NO alteren facturas históricas).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id     UUID         REFERENCES products(id) ON DELETE SET NULL,
  sku_snapshot       VARCHAR(60)  NOT NULL,
  nombre_snapshot    VARCHAR(160) NOT NULL,
  unidad_snapshot    VARCHAR(20)  NOT NULL DEFAULT 'unidad',
  cantidad           NUMERIC(14,3) NOT NULL CHECK (cantidad > 0),
  precio_unitario    NUMERIC(14,2) NOT NULL CHECK (precio_unitario >= 0),
  descuento_unit     NUMERIC(14,2) NOT NULL DEFAULT 0,
  subtotal           NUMERIC(14,2) NOT NULL,
  metadata           JSONB        NOT NULL DEFAULT '{}'::jsonb,
  orden              INT          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant  ON invoice_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items (product_id);

-- ---------------------------------------------------------------------
-- triggers updated_at (reutiliza la función set_updated_at de 001)
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_customers_updated ON customers;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_templates_updated ON invoice_templates;
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON invoice_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated ON invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Seed de plantillas vibrantes (idempotente). Una plantilla default
-- por cada tenant seed, con themes distintos acordes al rubro.
-- ---------------------------------------------------------------------
INSERT INTO invoice_templates (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
SELECT t.id, 'sunset-classic', 'Sunset Classic', 'Degradado cálido, ideal para retail y papelería.', TRUE,
  '{"accent":"#f97316","gradient_from":"#f97316","gradient_to":"#ec4899","font":"inter","layout":"modern","logo_position":"left"}'::jsonb,
  '{"impuesto_pct":0,"metodo_pago":"efectivo","moneda":"USD","notas":""}'::jsonb
FROM tenants t WHERE t.slug = 'papeleria-central'
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO invoice_templates (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
SELECT t.id, 'butcher-bold', 'Butcher Bold', 'Rojo sangre y crema, tipografía fuerte para carnicerías.', TRUE,
  '{"accent":"#dc2626","gradient_from":"#dc2626","gradient_to":"#7f1d1d","font":"inter","layout":"compact","logo_position":"center"}'::jsonb,
  '{"impuesto_pct":0,"metodo_pago":"efectivo","moneda":"USD","notas":"Conservar en refrigeración."}'::jsonb
FROM tenants t WHERE t.slug = 'carniceria-la-res'
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO invoice_templates (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
SELECT t.id, 'neon-tech', 'Neon Tech', 'Cian eléctrico, grid futurista, perfecto para electrónica.', TRUE,
  '{"accent":"#06b6d4","gradient_from":"#06b6d4","gradient_to":"#6366f1","font":"inter","layout":"modern","logo_position":"left"}'::jsonb,
  '{"impuesto_pct":16,"metodo_pago":"tarjeta","moneda":"USD","notas":"Garantía sujeta a serial."}'::jsonb
FROM tenants t WHERE t.slug = 'electro-hub'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Plantilla alterna global — disponible para todos
INSERT INTO invoice_templates (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
SELECT t.id, 'midnight-minimal', 'Midnight Minimal', 'Negro absoluto con acento violeta. Minimalismo elegante.', FALSE,
  '{"accent":"#7c5cff","gradient_from":"#7c5cff","gradient_to":"#22d3ee","font":"inter","layout":"minimal","logo_position":"right"}'::jsonb,
  '{"impuesto_pct":0,"metodo_pago":"transferencia","moneda":"USD","notas":""}'::jsonb
FROM tenants t
ON CONFLICT (tenant_id, slug) DO NOTHING;
