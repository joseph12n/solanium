const { Router } = require('express');
const ctrl = require('../controllers/activation.controller');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth.middleware');

const router = Router();

// Público: validar un token (útil para el frontend al cargar)
router.post('/verify', ctrl.verify);
router.get('/verify', ctrl.verify);

// Super-admin: emisión, listado global, renovación y revocación
router.post('/onboard', requireSuperAdmin, ctrl.onboard);
router.get('/', requireSuperAdmin, ctrl.listAll);
router.post('/:id/renew', requireSuperAdmin, ctrl.renew);
router.post('/:id/revoke', requireSuperAdmin, ctrl.revoke);

// Tenant: listar sus propios tokens activos
router.get('/mine', authMiddleware, ctrl.listMine);

module.exports = router;
