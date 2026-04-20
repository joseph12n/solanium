const { Router } = require('express');
const ctrl = require('../controllers/tenant.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', ctrl.list);
router.get('/current', authMiddleware, ctrl.current);

module.exports = router;
