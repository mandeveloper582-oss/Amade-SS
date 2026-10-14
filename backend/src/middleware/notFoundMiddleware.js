const { sendError } = require('../utils/apiResponse');

const notFoundMiddleware = (req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found.`, 404);
};

module.exports = notFoundMiddleware;
