const mongoose = require('mongoose');
const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const slugify = require('../utils/slugify');

const getServices = asyncHandler(async (req, res) => {
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
      { description: expression },
      { category: expression },
    ];
  }

  if (req.query.isPublished === 'true' || req.query.isPublished === 'false') {
    query.isPublished = req.query.isPublished === 'true';
  }

  const filter = { ...query, ...(req.user ? {} : { isPublished: true, isActive: true }) };
  const [data, total] = await Promise.all([
    Service.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Service.countDocuments(filter),
  ]);

  sendSuccess(res, 'Services fetched successfully.', {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / Number(limit)) || 0,
    },
  });
});

const getServiceById = asyncHandler(async (req, res) => {
  const identifier = req.params.id || req.params.slug || req.params.identifier;
  if (!mongoose.isValidObjectId(identifier) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(identifier)) {
    return sendError(res, 'Invalid service id or slug.', 400);
  }
  const query = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  const service = await Service.findOne(query);

  if (!service) {
    return sendError(res, 'Service not found.', 404);
  }

  if (!service.isPublished && !req.user) {
    return sendError(res, 'Service not available.', 403);
  }

  return sendSuccess(res, 'Service fetched successfully.', service);
});

const createService = asyncHandler(async (req, res) => {
  const {
    title, slug, description, shortDescription, category, icon, image, features,
    startingPrice, isFeatured, isPublished, isActive,
  } = req.body;

  const service = await Service.create({
    title,
    slug: slugify(slug || title),
    description,
    shortDescription,
    category,
    icon,
    image,
    features,
    startingPrice,
    isFeatured: isFeatured === true,
    isPublished: isPublished === true,
    isActive: isActive !== undefined ? isActive : isPublished === true,
  });

  return sendSuccess(res, 'Service created successfully.', service, 201);
});

const updateService = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid service id.', 400);
  const service = await Service.findById(req.params.id);

  if (!service) {
    return sendError(res, 'Service not found.', 404);
  }

  const editableFields = [
    'title', 'description', 'shortDescription', 'category', 'icon', 'image',
    'features', 'startingPrice', 'isFeatured', 'isPublished', 'isActive',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) service[field] = req.body[field];
  });
  if (req.body.slug !== undefined || req.body.title !== undefined) {
    service.slug = slugify(req.body.slug || req.body.title || service.title);
  }
  if (req.body.isPublished !== undefined && req.body.isActive === undefined) {
    service.isActive = req.body.isPublished;
  }
  if (req.body.isActive !== undefined && req.body.isPublished === undefined) {
    service.isPublished = req.body.isActive;
  }

  await service.save();
  return sendSuccess(res, 'Service updated successfully.', service);
});

const deleteService = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid service id.', 400);
  const service = await Service.findById(req.params.id);

  if (!service) {
    return sendError(res, 'Service not found.', 404);
  }

  await service.deleteOne();
  return sendSuccess(res, 'Service deleted successfully.');
});

module.exports = { getServices, getServiceById, createService, updateService, deleteService };
