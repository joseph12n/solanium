const { Router } = require('express');
const ctrl = require('../controllers/tenant.controller');
const { tenantMiddleware } = require('../middleware/tenant.middleware');

const router = Router();

router.get('/', ctrl.list);
router.get('/current', tenantMiddleware, ctrl.current);

module.exports = router;
