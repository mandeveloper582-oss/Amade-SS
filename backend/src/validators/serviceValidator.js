const { body } = require('express-validator');

const serviceValidator = [
  body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Title must be between 2 and 160 characters.'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 180 }).withMessage('Slug must be between 2 and 180 characters.'),
  body('description').trim().isLength({ min: 1, max: 10000 }).withMessage('Description is required and must be at most 10,000 characters.'),
  body('shortDescription').optional().isString().isLength({ max: 500 }).withMessage('Short description must be 500 characters or fewer.'),
  body('icon').optional({ nullable: true }).isString().isLength({ max: 100 }).withMessage('Icon must be 100 characters or fewer.'),
  body('image').optional({ nullable: true }).isString().isLength({ max: 2048 }).withMessage('Image must be a URL or upload path.'),
  body('category').optional().isString().trim().isLength({ max: 100 }).withMessage('Category must be 100 characters or fewer.'),
  body('features').optional().isArray().withMessage('Features must be a list.'),
  body('features.*').optional().isString().trim().isLength({ max: 300 }).withMessage('Each feature must be 300 characters or fewer.'),
  body('startingPrice').optional({ nullable: true, values: 'falsy' }).isFloat({ min: 0 }).withMessage('Starting price must be zero or greater.'),
  body('isFeatured').optional().isBoolean().withMessage('Featured must be a boolean.'),
  body('isPublished').optional().isBoolean().withMessage('Publication status must be a boolean.'),
  body('isActive').optional().isBoolean().withMessage('Active status must be a boolean.'),
];

module.exports = { serviceValidator };
