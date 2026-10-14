const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const token = req.cookies?.token || tokenFromHeader;

  if (!token) {
    return sendError(res, 'Not authorized, token missing.', 401);
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return sendError(res, 'Authentication configuration is missing.', 500);
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id || decoded.sub || decoded._id).select('-password');

    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    if (!user.isActive) {
      return sendError(res, 'This account is inactive.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', 401);
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 'Forbidden: insufficient permissions.', 403);
  }

  next();
};

module.exports = { protect, authorize };
