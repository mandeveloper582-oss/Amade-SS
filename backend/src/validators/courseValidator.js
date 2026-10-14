const { body } = require('express-validator');

const courseValidator = [
  body('title').trim().notEmpty().withMessage('Course title is required.'),
  body('description').trim().notEmpty().withMessage('Course description is required.'),
  body('status').optional().isIn(['draft', 'coming_soon', 'published', 'archived']).withMessage('Invalid course status.'),
  body('thumbnail').optional({ nullable: true }).isString().withMessage('Thumbnail must be a URL string.'),
  body('category').optional({ nullable: true }).isString().trim().withMessage('Category must be text.'),
  body('duration').optional({ nullable: true }).isString().trim().withMessage('Duration must be text.'),
  body('level').optional({ nullable: true }).isString().trim().withMessage('Level must be text.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or greater.'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean.'),
  body('technologies').optional().isArray().withMessage('Technologies must be a list.'),
  body('technologies.*').optional().isString().trim().withMessage('Each technology must be text.'),
];

module.exports = { courseValidator };
