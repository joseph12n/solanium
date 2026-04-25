const { Router } = require('express');
const ctrl = require('../controllers/activation.controller');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth.middleware');

const router = Router();

// ─── Público ──────────────────────────────────────────────────────────
// Verificar un code de 6 dígitos (flujo principal del Hero /login).
router.post('/verify', ctrl.verify);
router.get('/verify',  ctrl.verify);

// ─── Super-admin ──────────────────────────────────────────────────────
// Emisión de licencia (onboarding).
router.post('/onboard', requireSuperAdmin, ctrl.onboard);
// Listado global de tokens.
router.get('/',         requireSuperAdmin, ctrl.listAll);
// Ver el code vigente de un tenant (rota si expiró).
router.get('/current-code', requireSuperAdmin, ctrl.currentCode);
// Forzar rotación de un code (cron manual).
router.post('/:id/refresh-code', requireSuperAdmin, ctrl.refreshCode);
// Renovar fecha de expiración o revocar suscripción.
router.post('/:id/renew',  requireSuperAdmin, ctrl.renew);
router.post('/:id/revoke', requireSuperAdmin, ctrl.revoke);

// ─── Tenant autenticado ───────────────────────────────────────────────
router.get('/mine', authMiddleware, ctrl.listMine);

module.exports = router;
