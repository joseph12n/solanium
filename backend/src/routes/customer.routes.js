const { Router } = require('express');
const ctrl = require('../controllers/customer.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
