const express = require('express');
const { getServices, getServiceById, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const { serviceValidator } = require('../validators/serviceValidator');

const router = express.Router();

router.get('/admin', protect, authorize('admin', 'super_admin'), getServices);
router.get('/admin/:id', protect, authorize('admin', 'super_admin'), getServiceById);
router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', protect, authorize('admin', 'super_admin'), serviceValidator, validateRequest, createService);
router.put('/:id', protect, authorize('admin', 'super_admin'), serviceValidator, validateRequest, updateService);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteService);

module.exports = router;
