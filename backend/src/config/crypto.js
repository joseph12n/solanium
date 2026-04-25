const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const SCRYPT_KEYLEN = 64;

// Ventana de validez del código de activación (ms). Pasado este tiempo,
// el service regenera un nuevo código de 6 dígitos. Configurable por env
// para pruebas rápidas (ACTIVATION_CODE_TTL_MS=5000).
const DEFAULT_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Hashea un password con scrypt + salt aleatorio.
 * Usa crypto nativo de Node para evitar dependencias externas (bcrypt).
 */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return { hash: derived.toString('hex'), salt };
}

async function verifyPassword(password, hash, salt) {
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  const hashBuf = Buffer.from(hash, 'hex');
  return hashBuf.length === derived.length && crypto.timingSafeEqual(hashBuf, derived);
}

/**
 * Bearer de sesión largo (32 bytes hex). No rota dentro de la suscripción;
 * sólo se invalida al revocar el token o al expirar.
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Código de activación de 6 dígitos (000000–999999). Numérico, zero-padded,
 * generado con crypto.randomInt (uniforme y no-predecible). Rotan cada 15 min.
 *
 * Entropía: ~20 bits — insuficiente contra fuerza bruta sin rate-limit.
 * Mitigaciones acordadas:
 *   • Validez de 15 minutos (ver getCodeTtlMs).
 *   • Rate-limit futuro en el service/route (pendiente wiring explícito).
 *   • Vínculo implícito al tenant: el code ya identifica al tenant, no hace
 *     falta además el slug al verificar.
 */
function generateCode() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

function getCodeTtlMs() {
  const raw = Number(process.env.ACTIVATION_CODE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CODE_TTL_MS;
}

/**
 * Dado un timestamp de refresh, indica si el código sigue vigente.
 */
function isCodeFresh(refreshedAt) {
  if (!refreshedAt) return false;
  const ts = refreshedAt instanceof Date ? refreshedAt.getTime() : new Date(refreshedAt).getTime();
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < getCodeTtlMs();
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  generateCode,
  getCodeTtlMs,
  isCodeFresh,
};
