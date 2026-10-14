const User = require('../models/User');
const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/authValidator');

const register = [
  ...registerValidator,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const result = await AuthService.register({ name, email, password, phone });

    sendSuccess(res, 'User registered successfully.', result, 201);
  }),
];

const login = [
  ...loginValidator,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    sendSuccess(res, 'Login successful.', result);
  }),
];

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  sendSuccess(res, 'Logged out successfully.');
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  return sendSuccess(res, 'Current user fetched successfully.', user);
});

const changePassword = [
  ...changePasswordValidator,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Password changed successfully.');
  }),
];

module.exports = { register, login, logout, getCurrentUser, changePassword };
