const sendError = (res, message, statusCode = 500, details = null) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: isProduction ? message : message,
    ...(details && !isProduction ? { details } : {}),
  });
};

const errorMiddleware = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('API request failed:', {
      name: err.name || 'Error',
      statusCode: err.statusCode || 500,
    });
  } else {
    console.error(err);
  }

  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed.', 400, err.message);
  }

  if (err.name === 'CastError') {
    return sendError(res, 'Invalid resource id.', 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `${field} already exists.`, 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid or expired token.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Session expired. Please log in again.', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? 'Internal server error.'
    : err.message || 'Something went wrong on the server.';

  return sendError(res, message, statusCode);
};

module.exports = errorMiddleware;
