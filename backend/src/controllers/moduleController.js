const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const Lesson = require('../models/Lesson');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getCourseModules = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const courseExists = await Course.exists({ _id: courseId });
  if (!courseExists) {
    return sendError(res, 'Course not found.', 404);
  }

  const modules = await CourseModule.find({ course: courseId }).sort({ order: 1, _id: 1 }).lean();
  return sendSuccess(res, 'Course modules fetched successfully.', modules);
});

const createCourseModule = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }
  if (!title || title.length > 160) {
    return sendError(res, 'Module title is required and must be 160 characters or fewer.', 400);
  }

  const courseExists = await Course.exists({ _id: courseId });
  if (!courseExists) {
    return sendError(res, 'Course not found.', 404);
  }

  const highestOrder = await CourseModule.findOne({ course: courseId }).sort({ order: -1 }).select('order').lean();
  const module = await CourseModule.create({
    course: courseId,
    title,
    description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
    order: Number.isInteger(req.body.order) && req.body.order > 0
      ? req.body.order
      : (highestOrder?.order || 0) + 1,
    isPublished: req.body.isPublished === true,
  });

  return sendSuccess(res, 'Course module created successfully.', module, 201);
});

const updateCourseModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 'Invalid module id.', 400);
  }

  const module = await CourseModule.findById(id);
  if (!module) {
    return sendError(res, 'Module not found.', 404);
  }

  if (req.body.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim() || req.body.title.trim().length > 160) {
      return sendError(res, 'Module title is required and must be 160 characters or fewer.', 400);
    }
    module.title = req.body.title.trim();
  }
  if (req.body.description !== undefined) {
    if (typeof req.body.description !== 'string' || req.body.description.length > 2000) {
      return sendError(res, 'Module description must be 2000 characters or fewer.', 400);
    }
    module.description = req.body.description.trim();
  }
  if (req.body.order !== undefined) {
    const order = Number(req.body.order);
    if (!Number.isInteger(order) || order < 1) {
      return sendError(res, 'Module order must be a positive whole number.', 400);
    }
    module.order = order;
  }
  if (req.body.isPublished !== undefined) {
    if (typeof req.body.isPublished !== 'boolean') {
      return sendError(res, 'Module publication status must be a boolean.', 400);
    }
    module.isPublished = req.body.isPublished;
  }

  await module.save();
  return sendSuccess(res, 'Course module updated successfully.', module);
});

const deleteCourseModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 'Invalid module id.', 400);
  }

  const module = await CourseModule.findById(id);
  if (!module) {
    return sendError(res, 'Module not found.', 404);
  }
  if (await Lesson.exists({ module: module._id })) {
    return sendError(res, 'Move or delete this module’s lessons before deleting the module.', 409);
  }

  await module.deleteOne();
  return sendSuccess(res, 'Course module deleted successfully.');
});

module.exports = { getCourseModules, createCourseModule, updateCourseModule, deleteCourseModule };
