const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const slugify = require('../utils/slugify');

const getBlogPosts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return sendError(res, 'Page must be positive and limit must be between 1 and 100.', 400);
  }
  if (search.length > 100) return sendError(res, 'Search must be 100 characters or fewer.', 400);
  const query = {};

  if (search) {
    const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: expression },
      { excerpt: expression },
      { category: expression },
    ];
  }

  if (typeof req.query.category === 'string' && req.query.category.trim()) {
    query.category = req.query.category.trim();
  }

  if (req.user && ['draft', 'published', 'archived'].includes(req.query.status)) {
    query.status = req.query.status;
  }

  const activeQuery = req.user ? query : { ...query, status: 'published' };

  const [data, total] = await Promise.all([
    BlogPost.find(activeQuery).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    BlogPost.countDocuments(activeQuery),
  ]);

  return sendSuccess(res, 'Blog posts fetched successfully.', {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / Number(limit)) || 0,
    },
  });
});

const getBlogPostById = asyncHandler(async (req, res) => {
  const identifier = req.params.id || req.params.slug || req.params.identifier;
  if (!mongoose.isValidObjectId(identifier) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(identifier)) {
    return sendError(res, 'Invalid blog post id or slug.', 400);
  }
  const query = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  const blog = await BlogPost.findOne(query);

  if (!blog) {
    return sendError(res, 'Blog post not found.', 404);
  }

  if (!req.user && blog.status !== 'published') {
    return sendError(res, 'Blog post is not public.', 403);
  }

  return sendSuccess(res, 'Blog post fetched successfully.', blog);
});

const createBlogPost = asyncHandler(async (req, res) => {
  const {
    title, slug, excerpt, content, coverImage, category, tags, author, status,
    seoTitle, seoDescription, isFeatured,
  } = req.body;

  const blog = await BlogPost.create({
    title,
    slug: slugify(slug || title),
    excerpt,
    content,
    coverImage,
    category,
    tags,
    author: author || 'AMADE',
    status: status || 'draft',
    seoTitle,
    seoDescription,
    isFeatured: isFeatured === true,
    publishedAt: status === 'published' ? new Date() : null,
  });

  return sendSuccess(res, 'Blog post created successfully.', blog, 201);
});

const updateBlogPost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid blog post id.', 400);
  const blog = await BlogPost.findById(req.params.id);

  if (!blog) {
    return sendError(res, 'Blog post not found.', 404);
  }

  const editableFields = [
    'title', 'excerpt', 'content', 'coverImage', 'category', 'tags', 'author',
    'status', 'seoTitle', 'seoDescription', 'isFeatured',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) blog[field] = req.body[field];
  });
  if (req.body.slug !== undefined || req.body.title !== undefined) {
    blog.slug = slugify(req.body.slug || req.body.title || blog.title);
  }
  if (req.body.status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
  if (req.body.status && req.body.status !== 'published') blog.publishedAt = null;

  await blog.save();
  return sendSuccess(res, 'Blog post updated successfully.', blog);
});

const deleteBlogPost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid blog post id.', 400);
  const blog = await BlogPost.findById(req.params.id);

  if (!blog) {
    return sendError(res, 'Blog post not found.', 404);
  }

  await blog.deleteOne();
  return sendSuccess(res, 'Blog post deleted successfully.');
});

module.exports = { getBlogPosts, getBlogPostById, createBlogPost, updateBlogPost, deleteBlogPost };
