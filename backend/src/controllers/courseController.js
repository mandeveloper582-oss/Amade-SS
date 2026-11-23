const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const CourseModule = require('../models/CourseModule');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const slugify = require('../utils/slugify');
const { buildStudentLessonView } = require('../utils/lessonAccess');

const getAdminCourses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = req.query.status || 'all';

  if (req.query.search !== undefined && typeof req.query.search !== 'string') {
    return sendError(res, 'Search must be a single text value.', 400);
  }
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return sendError(res, 'Page must be positive and limit must be between 1 and 100.', 400);
  }
  if (!['all', 'draft', 'coming_soon', 'published', 'archived'].includes(status)) {
    return sendError(res, 'Invalid course status filter.', 400);
  }
  if (search.length > 100) {
    return sendError(res, 'Search must be 100 characters or fewer.', 400);
  }

  const filter = {};
  if (status !== 'all') filter.status = status;
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { title: expression },
      { description: expression },
      { category: expression },
    ];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  return sendSuccess(res, 'Courses fetched successfully.', {
    data: courses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const getCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const activeQuery = req.user ? query : { ...query, status: 'published', isPublished: true };

  const [data, total] = await Promise.all([
    Course.find(activeQuery)
      .populate('instructor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Course.countDocuments(activeQuery),
  ]);

  return sendSuccess(res, 'Courses fetched successfully.', {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 0,
    },
  });
});

const getCourseById = asyncHandler(async (req, res) => {
  const identifier = req.params.id || req.params.slug || req.params.identifier;
  const query = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  const course = await Course.findOne(query).populate('instructor', 'name');

  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  if (!req.user && (course.status !== 'published' || !course.isPublished)) {
    return sendError(res, 'Course is not available for public access.', 403);
  }

  return sendSuccess(res, 'Course fetched successfully.', course);
});

const createCourse = asyncHandler(async (req, res) => {
  const {
    title, description, thumbnail, category, status, duration,
    level, technologies, price, isPublished, learningObjectives, prerequisites,
  } = req.body;
  const normalizedStatus = status || 'draft';
  const course = await Course.create({
    title,
    description,
    thumbnail,
    category,
    status: normalizedStatus,
    duration,
    level,
    technologies,
    price,
    learningObjectives,
    prerequisites,
    isPublished: normalizedStatus === 'published' && isPublished === true,
    slug: slugify(title),
  });

  return sendSuccess(res, 'Course created successfully.', course, 201);
});

const updateCourse = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  const editableFields = [
    'title', 'description', 'thumbnail', 'category', 'status',
    'duration', 'level', 'technologies', 'price',
    'learningObjectives', 'prerequisites',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  if (req.body.title) {
    course.slug = slugify(req.body.title);
  }
  if (req.body.isPublished === true && req.body.status === undefined) {
    course.status = 'published';
  }
  course.isPublished = course.status === 'published'
    && (req.body.isPublished !== undefined ? req.body.isPublished === true : course.isPublished);

  await course.save();
  return sendSuccess(res, 'Course updated successfully.', course);
});

const updateCourseFinalProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const { title, instructions, requirements } = req.body;
  if (typeof title !== 'string' || title.trim().length > 160) {
    return sendError(res, 'Final project title must be text with at most 160 characters.', 400);
  }
  if (typeof instructions !== 'string' || instructions.length > 5000) {
    return sendError(res, 'Final project instructions must be text with at most 5000 characters.', 400);
  }
  if (!Array.isArray(requirements) || requirements.length > 20 || requirements.some(
    (requirement) => typeof requirement !== 'string' || requirement.trim().length > 500,
  )) {
    return sendError(res, 'Final project requirements must be an array of up to 20 text items.', 400);
  }

  const normalizedTitle = title.trim();
  const normalizedRequirements = requirements.map((requirement) => requirement.trim()).filter(Boolean);
  if (!normalizedTitle && (instructions.trim() || normalizedRequirements.length)) {
    return sendError(res, 'Add a final project title or clear its instructions and requirements.', 400);
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  course.finalProject = {
    title: normalizedTitle,
    instructions: instructions.trim(),
    requirements: normalizedRequirements,
  };
  await course.save();
  return sendSuccess(res, 'Final project assignment saved successfully.', course.finalProject);
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  const [lessonExists, enrollmentExists, moduleExists] = await Promise.all([
    Lesson.exists({ course: course._id }),
    Enrollment.exists({ course: course._id }),
    CourseModule.exists({ course: course._id }),
  ]);
  if (lessonExists || enrollmentExists || moduleExists) {
    return sendError(res, 'This course has lessons, modules, or enrollment records. Archive it instead to preserve learning data.', 409);
  }

  await course.deleteOne();
  return sendSuccess(res, 'Course deleted successfully.');
});

const getCourseLessons = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId || req.params.id;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const course = await Course.findById(courseId);

  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  let studentEnrollment = null;
  if (req.user.role === 'student') {
    studentEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ['active', 'completed'] },
    });
    if (!studentEnrollment) {
      return sendError(res, 'Access denied. You are not enrolled in this course.', 403);
    }
  }

  const lessonFilter = { course: courseId };
  if (req.user.role === 'student') lessonFilter.isPublished = true;
  const lessons = await Lesson.find(lessonFilter).sort({ order: 1, _id: 1 }).lean();
  const visibleLessons = req.user.role === 'student'
    ? await buildStudentLessonView(lessons, studentEnrollment, req.user._id)
    : lessons;
  return sendSuccess(res, 'Lessons fetched successfully.', visibleLessons);
});

const getCourseEnrollmentStatus = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  return sendSuccess(res, 'Enrollment status fetched successfully.', {
    course,
    enrollment,
  });
});

module.exports = {
  getCourses,
  getAdminCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCourseFinalProject,
  deleteCourse,
  getCourseLessons,
  getCourseEnrollmentStatus,
};
