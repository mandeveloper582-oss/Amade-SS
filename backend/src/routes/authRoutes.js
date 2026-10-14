const express = require('express');
const { register, login, logout, getCurrentUser, changePassword } = require('../controllers/authController');
const validateRequest = require('../middleware/validateMiddleware');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/authValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, register);
router.post('/login', loginValidator, validateRequest, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);
router.put('/change-password', protect, ...changePasswordValidator, validateRequest, changePassword);

module.exports = router;
