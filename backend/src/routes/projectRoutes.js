const express = require('express');
const { getProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const { projectValidator } = require('../validators/projectValidator');

const router = express.Router();

router.get('/admin', protect, authorize('admin', 'super_admin'), getProjects);
router.get('/admin/:id', protect, authorize('admin', 'super_admin'), getProjectById);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', protect, authorize('admin', 'super_admin'), projectValidator, validateRequest, createProject);
router.put('/:id', protect, authorize('admin', 'super_admin'), projectValidator, validateRequest, updateProject);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteProject);

module.exports = router;
