const express = require('express');
const {
  getStudentProject,
  submitStudentProject,
  getCourseProjectSubmissions,
  reviewCourseProjectSubmission,
} = require('../controllers/courseProjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/courses/:courseId', protect, authorize('student'), getStudentProject);
router.put('/courses/:courseId', protect, authorize('student'), submitStudentProject);
router.get('/admin/courses/:courseId/submissions', protect, authorize('admin', 'super_admin', 'instructor'), getCourseProjectSubmissions);
router.patch('/admin/submissions/:submissionId', protect, authorize('admin', 'super_admin', 'instructor'), reviewCourseProjectSubmission);

module.exports = router;
