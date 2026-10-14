const { body } = require('express-validator');

const messageValidator = [
  body('fullName').trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone must be 30 characters or fewer.'),
  body('service').trim().isLength({ min: 1, max: 120 }).withMessage('Service is required.'),
  body('subject').trim().isLength({ min: 2, max: 180 }).withMessage('Subject must be between 2 and 180 characters.'),
  body('message').trim().isLength({ min: 10, max: 10000 }).withMessage('Message must be between 10 and 10,000 characters.'),
];

const messageStatusValidator = [
  body('status').isIn(['new', 'read', 'replied', 'archived']).withMessage('Invalid message status.'),
];

module.exports = { messageValidator, messageStatusValidator };
