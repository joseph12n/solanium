const { Router } = require('express');
const ctrl = require('../controllers/template.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

// /presets es público — lista los diseños predefinidos que cualquier tenant
// puede aplicar. No requiere tenant header ni Bearer token.
router.get('/presets', ctrl.listPresets);

router.use(authMiddleware);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.post('/apply-preset', ctrl.applyPreset);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
