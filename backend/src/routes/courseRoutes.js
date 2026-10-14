const express = require('express');
const {
  getCourses,
  getAdminCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseLessons,
  getCourseEnrollmentStatus,
} = require('../controllers/courseController');
const { createLesson } = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const { courseValidator } = require('../validators/courseValidator');

const router = express.Router();

router.get('/admin', protect, authorize('admin', 'super_admin'), getAdminCourses);
router.get('/', getCourses);
router.get('/:courseId/lessons', protect, authorize('student', 'admin', 'super_admin', 'instructor'), getCourseLessons);
router.get('/lessons', protect, authorize('student', 'admin', 'super_admin', 'instructor'), getCourseLessons);
router.get('/:courseId/enrollment-status', protect, getCourseEnrollmentStatus);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('admin', 'super_admin'), courseValidator, validateRequest, createCourse);
router.post('/:courseId/lessons', protect, authorize('admin', 'super_admin', 'instructor'), createLesson);
router.put('/:id', protect, authorize('admin', 'super_admin'), courseValidator, validateRequest, updateCourse);
router.delete('/:id', protect, authorize('super_admin'), deleteCourse);

module.exports = router;
