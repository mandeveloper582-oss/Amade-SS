const express = require('express');
const { getLessons, getLessonById, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin', 'super_admin', 'instructor'), getLessons);
router.get('/:id', protect, authorize('student', 'admin', 'super_admin', 'instructor'), getLessonById);
router.post('/', protect, authorize('admin', 'super_admin', 'instructor'), createLesson);
router.put('/:id', protect, authorize('admin', 'super_admin', 'instructor'), updateLesson);
router.delete('/:id', protect, authorize('admin', 'super_admin', 'instructor'), deleteLesson);

module.exports = router;
