const express = require('express');
const {
  getProfile,
  updateProfile,
  getAvailableCourses,
  getMyCourses,
  getCourseLessons,
  getProgress,
  markLessonComplete,
  getDashboard,
  getAdminStudents,
  getAdminStudentById,
  updateAdminStudentStatus,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const { updateProfileValidator } = require('../validators/studentValidator');

const router = express.Router();

router.get('/admin', protect, authorize('admin', 'super_admin'), getAdminStudents);
router.get('/admin/:id', protect, authorize('admin', 'super_admin'), getAdminStudentById);
router.patch('/admin/:id/status', protect, authorize('admin', 'super_admin'), updateAdminStudentStatus);
router.get('/profile', protect, authorize('student'), getProfile);
router.put('/profile', protect, authorize('student'), updateProfileValidator, validateRequest, updateProfile);
router.get('/dashboard', protect, authorize('student'), getDashboard);
router.get('/courses', protect, authorize('student'), getAvailableCourses);
router.get('/my-courses', protect, authorize('student'), getMyCourses);
router.get('/courses/:courseId/lessons', protect, authorize('student'), getCourseLessons);
router.get('/progress', protect, authorize('student'), getProgress);
router.put('/lessons/:lessonId/complete', protect, authorize('student'), markLessonComplete);

module.exports = router;
