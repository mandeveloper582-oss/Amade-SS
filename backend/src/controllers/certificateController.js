const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const issueCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: 'completed',
    progress: 100,
  });
  if (!enrollment) {
    return sendError(res, 'Complete all course lessons before requesting a certificate.', 403);
  }

  const lessons = await Lesson.find({ course: courseId, isPublished: true }).select('_id').lean();
  if (!lessons.length) {
    return sendError(res, 'This course has no published lessons to certify.', 403);
  }

  const lessonIds = lessons.map(({ _id }) => _id);
  const completedLessonIds = new Set(enrollment.completedLessons.map(String));
  if (lessonIds.some((lessonId) => !completedLessonIds.has(String(lessonId)))) {
    return sendError(res, 'Complete every published lesson before requesting a certificate.', 403);
  }

  const quizzes = await Quiz.find({ lesson: { $in: lessonIds } }).select('lesson').lean();
  const quizLessonIds = quizzes.map(({ lesson }) => lesson);
  if (quizLessonIds.length) {
    const passedLessonIds = new Set((await QuizAttempt.distinct('lesson', {
      student: req.user._id,
      lesson: { $in: quizLessonIds },
      passed: true,
    })).map(String));
    if (quizLessonIds.some((lessonId) => !passedLessonIds.has(String(lessonId)))) {
      return sendError(res, 'Pass every published lesson quiz before requesting a certificate.', 403);
    }
  }

  const course = await Course.findById(courseId).select('title slug').lean();
  if (!course) {
    return sendError(res, 'Course not found.', 404);
  }

  let certificate;
  try {
    certificate = await Certificate.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      {
        $setOnInsert: {
          certificateNumber: `AMADE-${randomUUID().replace(/-/g, '').toUpperCase()}`,
          issuedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    certificate = await Certificate.findOne({ student: req.user._id, course: courseId });
    if (!certificate) throw error;
  }

  return sendSuccess(res, 'Certificate verified and ready.', {
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    studentName: req.user.name,
    courseTitle: course.title,
    courseSlug: course.slug,
  });
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const certificateNumber = String(req.params.certificateNumber || '').toUpperCase();
  if (!/^AMADE-[A-F0-9]{32}$/.test(certificateNumber)) {
    return sendError(res, 'Certificate number is invalid.', 400);
  }

  const certificate = await Certificate.findOne({ certificateNumber })
    .populate('student', 'name')
    .populate('course', 'title');
  if (!certificate || !certificate.student || !certificate.course) {
    return sendError(res, 'Certificate not found.', 404);
  }

  return sendSuccess(res, 'Certificate is valid.', {
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    studentName: certificate.student.name,
    courseTitle: certificate.course.title,
  });
});

module.exports = { issueCertificate, verifyCertificate };
