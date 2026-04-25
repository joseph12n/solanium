-- =====================================================================
-- Solanium :: Migración 004_activation_codes.sql
--
-- Evolución del modelo de activación hacia códigos cortos de 6 dígitos
-- con rotación cada 15 minutos y soporte multi-suscripción.
--
-- Cambios clave:
--   • activation_tokens.code           → VARCHAR(6): código numérico que
--       el cliente teclea para activar/entrar al sistema. Se regenera
--       cada 15 minutos (rotación perezosa en el service).
--   • activation_tokens.code_refreshed_at → marca la última rotación.
--       code_valid_until = code_refreshed_at + CODE_TTL (configurable;
--       default 15 min). Cuando expira, verify() lo renueva.
--   • activation_tokens.subscription_type → 'monthly' | 'annual',
--       dimensiona el alcance comercial (placeholder para facturación
--       recurrente, descuentos por plan anual, etc.).
--   • activation_tokens.token sigue siendo el Bearer de sesión largo
--       (JWT-like opaco) para llamadas autenticadas API. El code sólo
--       se usa al activar / re-iniciar sesión.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Añadimos columnas a activation_tokens
-- ---------------------------------------------------------------------
ALTER TABLE activation_tokens
  ADD COLUMN IF NOT EXISTS code              VARCHAR(6),
  ADD COLUMN IF NOT EXISTS code_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) NOT NULL DEFAULT 'monthly'
                           CHECK (subscription_type IN ('monthly','annual'));

-- Backfill: cualquier token existente recibe un code aleatorio de 6 dígitos.
-- LPAD garantiza que códigos bajos (123 → '000123') se persistan correctamente.
UPDATE activation_tokens
   SET code = LPAD((FLOOR(random() * 1000000))::text, 6, '0')
 WHERE code IS NULL;

-- A partir de aquí la columna es obligatoria.
ALTER TABLE activation_tokens
  ALTER COLUMN code SET NOT NULL;

-- Índice parcial: sólo exigimos unicidad del code entre tokens activos.
-- Así permitimos re-emitir el mismo 6 dígitos en el tiempo sin colisión
-- con registros ya revocados o expirados.
-- El predicado sólo puede contener funciones IMMUTABLE; NOW() es volátil,
-- así que sólo filtramos por revoked_at. La expiración se valida en servicio.
DROP INDEX IF EXISTS idx_activation_code_active;
CREATE UNIQUE INDEX idx_activation_code_active
  ON activation_tokens (code)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activation_code_refreshed
  ON activation_tokens (code_refreshed_at);
