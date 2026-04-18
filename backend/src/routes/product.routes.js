const { Router } = require('express');
const ctrl = require('../controllers/product.controller');
const { tenantMiddleware } = require('../middleware/tenant.middleware');

const router = Router();

router.use(tenantMiddleware);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
