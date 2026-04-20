const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const SCRYPT_KEYLEN = 64;

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
 * Genera un token opaco de 64 caracteres hex (32 bytes) — suficiente
 * entropía criptográfica para no ser adivinable.
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { hashPassword, verifyPassword, generateToken };
