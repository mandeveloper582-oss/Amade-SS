const mongoose = require('mongoose');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const slugify = require('../utils/slugify');

const buildProjectFilter = (query, includeDrafts) => {
  const filter = {};
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  if (search) {
    const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: expression }, { description: expression }, { category: expression }];
  }
  if (typeof query.category === 'string' && query.category.trim()) filter.category = query.category.trim();
  if (includeDrafts && ['true', 'false'].includes(query.isPublished)) filter.isPublished = query.isPublished === 'true';
  if (includeDrafts && ['true', 'false'].includes(query.isFeatured)) filter.isFeatured = query.isFeatured === 'true';
  if (!includeDrafts) filter.isPublished = true;
  return filter;
};

const getProjects = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return sendError(res, 'Page must be positive and limit must be between 1 and 100.', 400);
  }
  if (typeof req.query.search === 'string' && req.query.search.length > 100) {
    return sendError(res, 'Search must be 100 characters or fewer.', 400);
  }
  const filter = buildProjectFilter(req.query, Boolean(req.user));

  const [data, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Project.countDocuments(filter),
  ]);

  return sendSuccess(res, 'Projects fetched successfully.', {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / Number(limit)) || 0,
    },
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const identifier = req.params.id || req.params.slug || req.params.identifier;
  if (!mongoose.isValidObjectId(identifier) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(identifier)) {
    return sendError(res, 'Invalid project id or slug.', 400);
  }
  const query = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  const project = await Project.findOne(query);

  if (!project) {
    return sendError(res, 'Project not found.', 404);
  }

  if (!project.isPublished && !req.user) {
    return sendError(res, 'Project is not public.', 403);
  }

  return sendSuccess(res, 'Project fetched successfully.', project);
});

const createProject = asyncHandler(async (req, res) => {
  const {
    title, slug, description, overview, problem, solution, image, gallery,
    category, technologies, features, liveDemo, github, isFeatured, isPublished,
  } = req.body;
  const project = await Project.create({
    title,
    slug: slugify(slug || title),
    description,
    overview,
    problem,
    solution,
    image,
    gallery,
    category,
    technologies,
    features,
    liveDemo,
    github,
    isFeatured: isFeatured === true,
    isPublished: isPublished === true,
  });

  return sendSuccess(res, 'Project created successfully.', project, 201);
});

const updateProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid project id.', 400);
  const project = await Project.findById(req.params.id);

  if (!project) {
    return sendError(res, 'Project not found.', 404);
  }

  const editableFields = [
    'title', 'description', 'overview', 'problem', 'solution', 'image', 'gallery',
    'category', 'technologies', 'features', 'liveDemo', 'github', 'isFeatured', 'isPublished',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });
  if (req.body.slug !== undefined || req.body.title !== undefined) {
    project.slug = slugify(req.body.slug || req.body.title || project.title);
  }

  await project.save();
  return sendSuccess(res, 'Project updated successfully.', project);
});

const deleteProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid project id.', 400);
  const project = await Project.findById(req.params.id);

  if (!project) {
    return sendError(res, 'Project not found.', 404);
  }

  await project.deleteOne();
  return sendSuccess(res, 'Project deleted successfully.');
});

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
