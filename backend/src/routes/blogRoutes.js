const express = require('express');
const { getBlogPosts, getBlogPostById, createBlogPost, updateBlogPost, deleteBlogPost } = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const { blogValidator } = require('../validators/blogValidator');

const router = express.Router();

router.get('/admin', protect, authorize('admin', 'super_admin'), getBlogPosts);
router.get('/admin/:id', protect, authorize('admin', 'super_admin'), getBlogPostById);
router.get('/', getBlogPosts);
router.get('/:id', getBlogPostById);
router.post('/', protect, authorize('admin', 'super_admin'), blogValidator, validateRequest, createBlogPost);
router.put('/:id', protect, authorize('admin', 'super_admin'), blogValidator, validateRequest, updateBlogPost);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteBlogPost);

module.exports = router;
