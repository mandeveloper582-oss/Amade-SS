const express = require('express');
const {
  getEnrollments,
  getAdminEnrollments,
  getMyCourses,
  getEnrollmentById,
  enrollInCourse,
  updateEnrollment,
  updateAdminEnrollmentStatus,
  updateEnrollmentProgress,
  deleteEnrollment,
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my-courses', protect, authorize('student'), getMyCourses);
router.get('/admin', protect, authorize('admin', 'super_admin'), getAdminEnrollments);
router.get('/', protect, getEnrollments);
router.get('/:id', protect, getEnrollmentById);
router.post('/', protect, authorize('student'), enrollInCourse);
router.put('/:id', protect, authorize('admin', 'super_admin'), updateEnrollment);
router.patch('/admin/:id/status', protect, authorize('admin', 'super_admin'), updateAdminEnrollmentStatus);
router.put('/:id/progress', protect, updateEnrollmentProgress);
router.delete('/:id', protect, deleteEnrollment);

module.exports = router;
