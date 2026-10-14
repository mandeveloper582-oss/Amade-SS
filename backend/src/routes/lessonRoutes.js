const express = require('express');
const { getLessons, getLessonById, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getLessons);
router.get('/:id', getLessonById);
router.post('/', protect, authorize('admin', 'super_admin', 'instructor'), createLesson);
router.put('/:id', protect, authorize('admin', 'super_admin', 'instructor'), updateLesson);
router.delete('/:id', protect, authorize('admin', 'super_admin', 'instructor'), deleteLesson);

module.exports = router;
