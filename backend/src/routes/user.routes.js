const { Router } = require('express');
const ctrl = require('../controllers/user.controller');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth.middleware');

const router = Router();

// ─── Rutas públicas ────────────────────────────────────────────────
router.post('/login', ctrl.login);

// ─── Rutas de super-admin (gestión global del SaaS) ────────────────
router.get('/super-admins', requireSuperAdmin, ctrl.listSuperAdmins);
router.post('/super-admins', ctrl.createSuperAdmin);  // abierto sólo si no existe ninguno (bootstrap)

// ─── Rutas por tenant (admin invita a su equipo) ───────────────────
router.get('/me', authMiddleware, ctrl.me);
router.get('/', authMiddleware, ctrl.list);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, ctrl.create);
router.patch('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
