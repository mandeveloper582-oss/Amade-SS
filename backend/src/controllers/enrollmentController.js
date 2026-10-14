const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getEnrollments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    filter.student = req.user._id;
  }

  const enrollments = await Enrollment.find(filter)
    .populate('student', 'name email')
    .populate('course', 'title slug status isPublished');

  return sendSuccess(res, 'Enrollments fetched successfully.', enrollments);
});

const getAdminEnrollments = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = req.query.status || 'all';
  const courseId = req.query.courseId;

  if (req.query.search !== undefined && typeof req.query.search !== 'string') {
    return sendError(res, 'Search must be a single text value.', 400);
  }
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return sendError(res, 'Page must be positive and limit must be between 1 and 100.', 400);
  }
  if (!['all', 'active', 'completed', 'cancelled'].includes(status)) {
    return sendError(res, 'Status must be active, completed, cancelled, or all.', 400);
  }
  if (courseId !== undefined && !mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }
  if (search.length > 100) {
    return sendError(res, 'Search must be 100 characters or fewer.', 400);
  }

  const filter = {};
  if (status !== 'all') filter.status = status;
  if (courseId) filter.course = courseId;
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(escapedSearch, 'i');
    const [students, courses] = await Promise.all([
      User.find({ role: 'student', $or: [{ name: expression }, { email: expression }] }).select('_id').lean(),
      Course.find({ title: expression }).select('_id').lean(),
    ]);
    const matchingStudents = students.map(({ _id }) => _id);
    const matchingCourses = courses.map(({ _id }) => _id);
    filter.$or = [
      { student: { $in: matchingStudents } },
      { course: { $in: matchingCourses } },
    ];
  }

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate('student', 'name email isActive')
      .populate('course', 'title slug status')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(filter),
  ]);

  return sendSuccess(res, 'Enrollments fetched successfully.', {
    data: enrollments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const getMyCourses = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user._id,
    status: { $in: ['active', 'completed'] },
  })
    .populate({
      path: 'course',
      select: 'title slug description thumbnail status isPublished duration level price instructor',
      populate: { path: 'instructor', select: 'name' },
    })
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'My enrolled courses fetched successfully.', enrollments);
});

const getEnrollmentById = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id).populate('student', 'name email').populate('course');

  if (!enrollment) {
    return sendError(res, 'Enrollment not found.', 404);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && enrollment.student._id.toString() !== req.user._id.toString()) {
    return sendError(res, 'Forbidden.', 403);
  }

  return sendSuccess(res, 'Enrollment fetched successfully.', enrollment);
});

const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  if (course.status === 'coming_soon' || course.status !== 'published' || !course.isPublished) {
    return sendError(res, 'This course is not available for enrollment.', 403);
  }

  const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    return sendError(res, 'You are already enrolled in this course.', 409);
  }

  let enrollment;
  try {
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: 'active',
      progress: 0,
      completedLessons: [],
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'You are already enrolled in this course.', 409);
    }
    throw error;
  }

  return sendSuccess(res, 'Enrollment created successfully.', enrollment, 201);
});

const updateEnrollment = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid enrollment id.', 400);
  }

  const fields = Object.keys(req.body || {});
  if (fields.length !== 1 || fields[0] !== 'status') {
    return sendError(res, 'Only the enrollment status can be updated here.', 400);
  }
  if (!['active', 'completed', 'cancelled'].includes(req.body.status)) {
    return sendError(res, 'Status must be active, completed, or cancelled.', 400);
  }

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return sendError(res, 'Enrollment not found.', 404);
  }

  enrollment.status = req.body.status;
  enrollment.progress = req.body.status === 'completed' ? 100 : enrollment.progress;
  enrollment.completedAt = req.body.status === 'completed' ? (enrollment.completedAt || new Date()) : null;
  await enrollment.save();
  return sendSuccess(res, 'Enrollment updated successfully.', enrollment);
});

const updateAdminEnrollmentStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid enrollment id.', 400);
  }
  if (typeof req.body?.status !== 'string' || !['active', 'completed', 'cancelled'].includes(req.body.status)) {
    return sendError(res, 'Status must be active, completed, or cancelled.', 400);
  }

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return sendError(res, 'Enrollment not found.', 404);
  }

  enrollment.status = req.body.status;
  enrollment.progress = req.body.status === 'completed' ? 100 : enrollment.progress;
  enrollment.completedAt = req.body.status === 'completed' ? (enrollment.completedAt || new Date()) : null;
  await enrollment.save();

  return sendSuccess(res, 'Enrollment status updated successfully.', enrollment);
});

const updateEnrollmentProgress = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id).populate('course');
  if (!enrollment) {
    return sendError(res, 'Enrollment not found.', 404);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && enrollment.student.toString() !== req.user._id.toString()) {
    return sendError(res, 'Forbidden.', 403);
  }

  const { completedLessons } = req.body;
  if (Array.isArray(completedLessons)) {
    const uniqueLessonIds = [...new Set(completedLessons.map((id) => id.toString()))];
    if (uniqueLessonIds.some((id) => !mongoose.isValidObjectId(id))) {
      return sendError(res, 'completedLessons must contain valid lesson ids.', 400);
    }
    const matchingLessons = await Lesson.find({
      _id: { $in: uniqueLessonIds },
      course: enrollment.course._id,
      isPublished: true,
    }).select('_id').lean();
    if (matchingLessons.length !== uniqueLessonIds.length) {
      return sendError(res, 'All completed lessons must belong to this course and be published.', 400);
    }
    enrollment.completedLessons = uniqueLessonIds;
  }

  const totalLessons = await Lesson.countDocuments({ course: enrollment.course._id, isPublished: true });
  const completionRate = totalLessons > 0 ? (enrollment.completedLessons.length / totalLessons) * 100 : 0;
  enrollment.progress = Math.min(100, Math.round(completionRate));
  enrollment.status = enrollment.progress >= 100 ? 'completed' : 'active';

  if (enrollment.status === 'completed') {
    enrollment.completedAt = new Date();
  } else {
    enrollment.completedAt = null;
  }

  await enrollment.save();
  return sendSuccess(res, 'Enrollment progress updated successfully.', enrollment);
});

const deleteEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return sendError(res, 'Enrollment not found.', 404);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && enrollment.student.toString() !== req.user._id.toString()) {
    return sendError(res, 'Forbidden.', 403);
  }

  await enrollment.deleteOne();
  return sendSuccess(res, 'Enrollment deleted successfully.');
});

module.exports = {
  getEnrollments,
  getAdminEnrollments,
  getMyCourses,
  getEnrollmentById,
  enrollInCourse,
  updateEnrollment,
  updateAdminEnrollmentStatus,
  updateEnrollmentProgress,
  deleteEnrollment,
};
