const express = require('express');
const {
  getCourseModules,
  createCourseModule,
  updateCourseModule,
  deleteCourseModule,
} = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
const canManageCourses = authorize('admin', 'super_admin', 'instructor');

router.get('/course/:courseId', protect, canManageCourses, getCourseModules);
router.post('/course/:courseId', protect, canManageCourses, createCourseModule);
router.put('/:id', protect, canManageCourses, updateCourseModule);
router.delete('/:id', protect, canManageCourses, deleteCourseModule);

module.exports = router;
