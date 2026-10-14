const express = require('express');
const rateLimit = require('express-rate-limit');
const { getMessages, getMessageById, createMessage, updateMessage, deleteMessage } = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const { messageValidator, messageStatusValidator } = require('../validators/messageValidator');

const router = express.Router();
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many contact submissions. Please try again later.',
});

router.get('/', protect, authorize('admin', 'super_admin'), getMessages);
router.get('/:id', protect, authorize('admin', 'super_admin'), getMessageById);
router.post('/', messageLimiter, messageValidator, validateRequest, createMessage);
router.put('/:id', protect, authorize('admin', 'super_admin'), messageStatusValidator, validateRequest, updateMessage);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteMessage);

module.exports = router;
