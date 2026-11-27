const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Certificate = require('../models/Certificate');
const CertificateRequest = require('../models/CertificateRequest');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const verifyCourseCompletion = async ({ studentId, courseId }) => {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: 'completed',
    progress: 100,
  });
  if (!enrollment) {
    return { error: 'Complete all course lessons before requesting a certificate.', statusCode: 403 };
  }

  const lessons = await Lesson.find({ course: courseId, isPublished: true }).select('_id').lean();
  if (!lessons.length) {
    return { error: 'This course has no published lessons to certify.', statusCode: 403 };
  }

  const completedLessonIds = new Set(enrollment.completedLessons.map(String));
  const lessonIds = lessons.map(({ _id }) => _id);
  if (lessonIds.some((lessonId) => !completedLessonIds.has(String(lessonId)))) {
    return { error: 'Complete every published lesson before requesting a certificate.', statusCode: 403 };
  }

  const quizzes = await Quiz.find({ lesson: { $in: lessonIds } }).select('lesson').lean();
  const quizLessonIds = quizzes.map(({ lesson }) => lesson);
  if (quizLessonIds.length) {
    const passedLessonIds = new Set((await QuizAttempt.distinct('lesson', {
      student: studentId,
      lesson: { $in: quizLessonIds },
      passed: true,
    })).map(String));
    if (quizLessonIds.some((lessonId) => !passedLessonIds.has(String(lessonId)))) {
      return { error: 'Pass every published lesson quiz before requesting a certificate.', statusCode: 403 };
    }
  }

  return { enrollment };
};

const requestCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const completion = await verifyCourseCompletion({ studentId: req.user._id, courseId });
  if (completion.error) {
    return sendError(res, completion.error, completion.statusCode);
  }

  const existing = await CertificateRequest.findOne({ student: req.user._id, course: courseId });
  if (existing?.status === 'approved') {
    const certificate = await Certificate.findById(existing.certificate);
    if (!certificate) {
      return sendError(res, 'The approved certificate record is unavailable.', 404);
    }
    const course = await Course.findById(courseId).select('title slug').lean();
    return sendSuccess(res, 'Certificate request is approved.', {
      status: 'approved',
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
      studentName: req.user.name,
      courseTitle: course?.title || '',
      courseSlug: course?.slug || '',
    });
  }

  if (existing?.status === 'pending') {
    return sendSuccess(res, 'Certificate request is pending admin approval.', {
      status: 'pending',
      requestedAt: existing.requestedAt,
    }, 202);
  }

  const request = existing
    ? await CertificateRequest.findByIdAndUpdate(
      existing._id,
      { status: 'pending', rejectionReason: '', requestedAt: new Date(), reviewedAt: null, reviewedBy: null, certificate: null },
      { new: true, runValidators: true },
    )
    : await CertificateRequest.create({
      student: req.user._id,
      course: courseId,
      enrollment: completion.enrollment._id,
    });

  return sendSuccess(res, 'Certificate request submitted for admin approval.', {
    status: 'pending',
    requestedAt: request.requestedAt,
  }, 202);
});

const getCertificateRequestStatus = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, 'Invalid course id.', 400);
  }

  const request = await CertificateRequest.findOne({ student: req.user._id, course: courseId })
    .populate('student', 'name')
    .populate('course', 'title slug')
    .populate('certificate');
  if (!request) {
    return sendSuccess(res, 'No certificate request found.', { status: 'none' });
  }

  return sendSuccess(res, 'Certificate request status fetched successfully.', {
    status: request.status,
    requestedAt: request.requestedAt,
    reviewedAt: request.reviewedAt,
    rejectionReason: request.rejectionReason,
    studentName: request.student?.name || req.user.name,
    courseTitle: request.course?.title || '',
    courseSlug: request.course?.slug || '',
    certificate: request.status === 'approved' && request.certificate
      ? {
          certificateNumber: request.certificate.certificateNumber,
          issuedAt: request.certificate.issuedAt,
        }
      : null,
  });
});

const getCertificateRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  if (!['pending', 'approved', 'rejected', 'all'].includes(status)) {
    return sendError(res, 'Invalid certificate request status.', 400);
  }

  const filter = status === 'all' ? {} : { status };
  const requests = await CertificateRequest.find(filter)
    .populate('student', 'name email phone')
    .populate('course', 'title slug')
    .populate('enrollment')
    .populate('certificate')
    .populate('reviewedBy', 'name email')
    .sort({ requestedAt: -1 });

  return sendSuccess(res, 'Certificate requests fetched successfully.', requests);
});

const approveCertificateRequest = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.requestId)) {
    return sendError(res, 'Invalid certificate request id.', 400);
  }

  const request = await CertificateRequest.findById(req.params.requestId);
  if (!request) {
    return sendError(res, 'Certificate request not found.', 404);
  }
  if (request.status === 'approved') {
    return sendError(res, 'This certificate request has already been approved.', 409);
  }

  const completion = await verifyCourseCompletion({
    studentId: request.student,
    courseId: request.course,
  });
  if (completion.error) {
    return sendError(res, completion.error, completion.statusCode);
  }

  let certificate;
  try {
    certificate = await Certificate.findOneAndUpdate(
      { student: request.student, course: request.course },
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
    certificate = await Certificate.findOne({ student: request.student, course: request.course });
    if (!certificate) throw error;
  }

  request.status = 'approved';
  request.rejectionReason = '';
  request.reviewedAt = new Date();
  request.reviewedBy = req.user._id;
  request.certificate = certificate._id;
  await request.save();

  return sendSuccess(res, 'Certificate request approved.', {
    request,
    certificateNumber: certificate.certificateNumber,
  });
});

const rejectCertificateRequest = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.requestId)) {
    return sendError(res, 'Invalid certificate request id.', 400);
  }

  const rejectionReason = String(req.body?.rejectionReason || '').trim();
  if (rejectionReason.length > 1000) {
    return sendError(res, 'Rejection reason must be 1000 characters or fewer.', 400);
  }

  const request = await CertificateRequest.findById(req.params.requestId);
  if (!request) {
    return sendError(res, 'Certificate request not found.', 404);
  }
  if (request.status === 'approved') {
    return sendError(res, 'An approved certificate request cannot be rejected.', 409);
  }

  request.status = 'rejected';
  request.rejectionReason = rejectionReason;
  request.reviewedAt = new Date();
  request.reviewedBy = req.user._id;
  request.certificate = null;
  await request.save();

  return sendSuccess(res, 'Certificate request rejected.', request);
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const certificateNumber = String(req.params.certificateNumber || '').trim().toUpperCase();
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

module.exports = {
  requestCertificate,
  getCertificateRequestStatus,
  getCertificateRequests,
  approveCertificateRequest,
  rejectCertificateRequest,
  verifyCertificate,
};
