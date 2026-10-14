const { body } = require('express-validator');

const blogValidator = [
  body('title').trim().isLength({ min: 2, max: 180 }).withMessage('Title must be between 2 and 180 characters.'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 200 }).withMessage('Slug must be between 2 and 200 characters.'),
  body('excerpt').optional().isString().isLength({ max: 500 }).withMessage('Excerpt must be 500 characters or fewer.'),
  body('content').trim().isLength({ min: 1, max: 100000 }).withMessage('Article content is required and must be at most 100,000 characters.'),
  body('coverImage').optional({ nullable: true }).isString().isLength({ max: 2048 }).withMessage('Cover image must be a URL or upload path.'),
  body('category').optional().isString().trim().isLength({ max: 100 }).withMessage('Category must be 100 characters or fewer.'),
  body('tags').optional().isArray().withMessage('Tags must be a list.'),
  body('tags.*').optional().isString().trim().isLength({ max: 60 }).withMessage('Each tag must be 60 characters or fewer.'),
  body('author').optional().isString().trim().isLength({ max: 100 }).withMessage('Author must be 100 characters or fewer.'),
  body('seoTitle').optional().isString().isLength({ max: 180 }).withMessage('SEO title must be 180 characters or fewer.'),
  body('seoDescription').optional().isString().isLength({ max: 320 }).withMessage('SEO description must be 320 characters or fewer.'),
  body('isFeatured').optional().isBoolean().withMessage('Featured must be a boolean.'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid blog status.'),
];

module.exports = { blogValidator };
