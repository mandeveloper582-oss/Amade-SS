const { body } = require('express-validator');

const projectValidator = [
  body('title').trim().isLength({ min: 2, max: 160 }).withMessage('Title must be between 2 and 160 characters.'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 180 }).withMessage('Slug must be between 2 and 180 characters.'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Short description is required and must be at most 500 characters.'),
  body('overview').optional().isString().isLength({ max: 20000 }).withMessage('Overview must be 20,000 characters or fewer.'),
  body('problem').optional().isString().isLength({ max: 10000 }).withMessage('Problem must be 10,000 characters or fewer.'),
  body('solution').optional().isString().isLength({ max: 10000 }).withMessage('Solution must be 10,000 characters or fewer.'),
  body('image').optional({ nullable: true }).isString().isLength({ max: 2048 }).withMessage('Image must be a valid URL or upload path.'),
  body('category').optional().isString().trim().isLength({ max: 100 }).withMessage('Category must be 100 characters or fewer.'),
  body('technologies').optional().isArray().withMessage('Technologies must be a list.'),
  body('technologies.*').optional().isString().trim().isLength({ max: 80 }).withMessage('Each technology must be 80 characters or fewer.'),
  body('features').optional().isArray().withMessage('Features must be a list.'),
  body('features.*').optional().isString().trim().isLength({ max: 300 }).withMessage('Each feature must be 300 characters or fewer.'),
  body('liveDemo').optional({ nullable: true }).isURL({ require_protocol: true }).withMessage('Live demo must be a valid URL.'),
  body('github').optional({ nullable: true }).isURL({ require_protocol: true }).withMessage('GitHub must be a valid URL.'),
  body('isFeatured').optional().isBoolean().withMessage('Featured must be a boolean.'),
  body('isPublished').optional().isBoolean().withMessage('Publication status must be a boolean.'),
];

module.exports = { projectValidator };
