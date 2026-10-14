const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  return sendSuccess(res, 'Profile fetched successfully.', user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  const allowedFields = ['name', 'phone', 'avatar'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();
  return sendSuccess(res, 'Profile updated successfully.', {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
  });
});

const getAvailableCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: 'published', isPublished: true }).sort({ createdAt: -1 });
  return sendSuccess(res, 'Available courses fetched successfully.', courses);
});

const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Enrollment.find({
    student: req.user._id,
    status: { $in: ['active', 'completed'] },
  })
    .populate('course', 'title description thumbnail slug status duration level price')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Enrolled courses fetched successfully.', courses);
});

const getCourseLessons = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: { $in: ['active', 'completed'] },
  });

  if (!enrollment) {
    return sendError(res, 'Access denied. You are not enrolled in this course.', 403);
  }

  const lessons = await Lesson.find({ course: courseId, isPublished: true }).sort({ order: 1 });
  return sendSuccess(res, 'Course lessons fetched successfully.', lessons);
});

const getProgress = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user._id,
    status: { $in: ['active', 'completed'] },
  })
    .populate('course', 'title slug thumbnail status')
    .populate({ path: 'completedLessons', match: { isPublished: true }, select: '_id' })
    .sort({ createdAt: -1 });

  const data = await Promise.all(enrollments.map(async (enrollment) => {
    const totalLessons = await Lesson.countDocuments({ course: enrollment.course._id, isPublished: true });
    return {
      enrollmentId: enrollment._id,
      course: enrollment.course,
      progress: enrollment.progress,
      status: enrollment.status,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      completedAt: enrollment.completedAt,
    };
  }));

  return sendSuccess(res, 'Student progress fetched successfully.', data);
});

const markLessonComplete = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  if (!mongoose.isValidObjectId(lessonId)) {
    return sendError(res, 'Invalid lesson id.', 400);
  }

  const lesson = await Lesson.findById(lessonId);

  if (!lesson) {
    return sendError(res, 'Lesson not found.', 404);
  }
  if (!lesson.isPublished) {
    return sendError(res, 'This lesson is not available.', 403);
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: lesson.course,
    status: { $in: ['active', 'completed'] },
  });
  if (!enrollment) {
    return sendError(res, 'You are not enrolled in this course.', 403);
  }

  const completed = new Set(enrollment.completedLessons.map((id) => id.toString()));
  completed.add(lessonId);
  enrollment.completedLessons = Array.from(completed);

  const publishedLessons = await Lesson.find({ course: lesson.course, isPublished: true }).select('_id').lean();
  const publishedLessonIds = new Set(publishedLessons.map(({ _id }) => _id.toString()));
  const completedPublishedLessons = enrollment.completedLessons.filter((completedLessonId) => publishedLessonIds.has(completedLessonId.toString()));
  enrollment.progress = publishedLessons.length > 0
    ? Math.min(100, Math.round((completedPublishedLessons.length / publishedLessons.length) * 100))
    : 0;
  enrollment.status = enrollment.progress >= 100 ? 'completed' : 'active';

  if (enrollment.status === 'completed') {
    enrollment.completedAt = new Date();
  } else {
    enrollment.completedAt = null;
  }

  await enrollment.save();
  return sendSuccess(res, 'Lesson marked as completed.', enrollment);
});

const getDashboard = asyncHandler(async (req, res) => {
  const [allEnrollments, recentEnrollments] = await Promise.all([
    Enrollment.find({ student: req.user._id, status: { $in: ['active', 'completed'] } }).select('status progress').lean(),
    Enrollment.find({ student: req.user._id, status: { $in: ['active', 'completed'] } })
      .populate('course', 'title slug thumbnail instructor')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);
  const totalEnrollments = allEnrollments.length;
  const totalCompleted = allEnrollments.filter((enrollment) => enrollment.status === 'completed').length;
  const totalInProgress = allEnrollments.filter((enrollment) => enrollment.status === 'active').length;
  const overallProgress = totalEnrollments
    ? Math.round(allEnrollments.reduce((total, enrollment) => total + enrollment.progress, 0) / totalEnrollments)
    : 0;

  return sendSuccess(res, 'Student dashboard data fetched successfully.', {
    totalEnrollments,
    totalCompleted,
    totalInProgress,
    overallProgress,
    recentEnrollments,
  });
});

const getAdminStudents = asyncHandler(async (req, res) => {
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

  if (status !== 'all' && status !== 'active' && status !== 'inactive') {
    return sendError(res, 'Status must be active, inactive, or all.', 400);
  }

  const filter = { role: 'student' };
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchExpression = new RegExp(escapedSearch, 'i');
    filter.$or = [{ name: searchExpression }, { email: searchExpression }];
  }

  const [students, total] = await Promise.all([
    User.find(filter)
      .select('name email phone avatar role isActive createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  const studentIds = students.map((student) => student._id);
  const enrollmentCounts = studentIds.length
    ? await Enrollment.aggregate([
      { $match: { student: { $in: studentIds } } },
      { $group: { _id: '$student', count: { $sum: 1 } } },
    ])
    : [];
  const countsByStudent = new Map(enrollmentCounts.map(({ _id, count }) => [_id.toString(), count]));

  return sendSuccess(res, 'Students fetched successfully.', {
    data: students.map((student) => ({
      ...student,
      enrollmentCount: countsByStudent.get(student._id.toString()) || 0,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getAdminStudentById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid student id.', 400);
  }

  const student = await User.findOne({ _id: req.params.id, role: 'student' })
    .select('name email phone avatar role isActive createdAt')
    .lean();

  if (!student) {
    return sendError(res, 'Student not found.', 404);
  }

  const enrollments = await Enrollment.find({ student: student._id })
    .populate('course', 'title slug status thumbnail')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 'Student details fetched successfully.', { ...student, enrollments });
});

const updateAdminStudentStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 'Invalid student id.', 400);
  }

  if (typeof req.body?.isActive !== 'boolean') {
    return sendError(res, 'isActive must be a boolean.', 400);
  }

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    { $set: { isActive: req.body.isActive } },
    { new: true, runValidators: true },
  ).select('name email phone avatar role isActive createdAt');

  if (!student) {
    return sendError(res, 'Student not found.', 404);
  }

  return sendSuccess(res, 'Student status updated successfully.', student);
});

module.exports = {
  getProfile,
  updateProfile,
  getAvailableCourses,
  getMyCourses,
  getCourseLessons,
  getProgress,
  markLessonComplete,
  getDashboard,
  getAdminStudents,
  getAdminStudentById,
  updateAdminStudentStatus,
};
