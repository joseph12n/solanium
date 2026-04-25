const { Router } = require('express');
const ctrl = require('../controllers/invoice.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();
router.use(authMiddleware);

router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.post('/:id/mark-paid', ctrl.markAsPaid);
router.post('/:id/send-email', ctrl.sendEmail);
router.delete('/:id', ctrl.remove);

module.exports = router;
