const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getQuiz, createOrUpdateQuiz, submitQuizAttempt, getQuizAttemptHistory } = require('../controllers/quizController');

const router = express.Router();

router.get('/lessons/:lessonId', protect, authorize('student', 'admin', 'super_admin', 'instructor'), getQuiz);
router.get('/:lessonId', protect, authorize('student', 'admin', 'super_admin', 'instructor'), getQuiz);
router.post('/lessons/:lessonId', protect, authorize('admin', 'super_admin', 'instructor'), createOrUpdateQuiz);
router.post('/:lessonId', protect, authorize('admin', 'super_admin', 'instructor'), createOrUpdateQuiz);
router.post('/lessons/:lessonId/submit', protect, authorize('student'), submitQuizAttempt);
router.post('/:lessonId/submit', protect, authorize('student'), submitQuizAttempt);
router.get('/lessons/:lessonId/history', protect, authorize('student'), getQuizAttemptHistory);
router.get('/:lessonId/history', protect, authorize('student'), getQuizAttemptHistory);

module.exports = router;
