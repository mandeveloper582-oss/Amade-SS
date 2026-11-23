const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseProjectSubmission = require('../models/CourseProjectSubmission');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const normalizeHttpsUrl = (value) => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || value.length > 2000) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const getStudentProject = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, 'Invalid course id.', 400);

  const [course, enrollment] = await Promise.all([
    Course.findById(courseId).select('title finalProject').lean(),
    Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ['active', 'completed'] },
    }),
  ]);
  if (!course) return sendError(res, 'Course not found.', 404);
  if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);

  const submission = course.finalProject?.title
    ? await CourseProjectSubmission.findOne({ student: req.user._id, course: courseId })
        .select('summary repositoryUrl demoUrl status feedback submittedAt reviewedAt')
        .lean()
    : null;

  return sendSuccess(res, 'Course final project fetched successfully.', {
    courseTitle: course.title,
    finalProject: course.finalProject?.title ? course.finalProject : null,
    submission,
  });
});

const submitStudentProject = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, 'Invalid course id.', 400);

  const summary = typeof req.body.summary === 'string' ? req.body.summary.trim() : '';
  if (!summary || summary.length > 5000) {
    return sendError(res, 'A written project summary of 1 to 5000 characters is required.', 400);
  }

  const repositoryUrl = normalizeHttpsUrl(req.body.repositoryUrl);
  const demoUrl = normalizeHttpsUrl(req.body.demoUrl);
  if (repositoryUrl === null || demoUrl === null) {
    return sendError(res, 'Repository and demo links must be valid HTTPS URLs without embedded credentials.', 400);
  }
  if (!repositoryUrl && !demoUrl) {
    return sendError(res, 'Provide at least one repository or live demo link.', 400);
  }

  const [course, enrollment] = await Promise.all([
    Course.findById(courseId).select('finalProject.title').lean(),
    Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ['active', 'completed'] },
    }),
  ]);
  if (!course) return sendError(res, 'Course not found.', 404);
  if (!enrollment) return sendError(res, 'You are not enrolled in this course.', 403);
  if (!course.finalProject?.title) {
    return sendError(res, 'This course does not have a final project assignment.', 404);
  }

  const submissionData = {
    summary,
    repositoryUrl,
    demoUrl,
    status: 'submitted',
    feedback: '',
    reviewedBy: null,
    submittedAt: new Date(),
    reviewedAt: null,
  };
  let submission;
  try {
    submission = await CourseProjectSubmission.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { $set: submissionData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    submission = await CourseProjectSubmission.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { $set: submissionData },
      { new: true, runValidators: true },
    );
    if (!submission) throw error;
  }

  return sendSuccess(res, 'Final project submitted. You can update it until it has been reviewed.', submission);
});

const getCourseProjectSubmissions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, 'Invalid course id.', 400);
  if (!(await Course.exists({ _id: courseId }))) return sendError(res, 'Course not found.', 404);

  const submissions = await CourseProjectSubmission.find({ course: courseId })
    .populate('student', 'name email')
    .populate('reviewedBy', 'name')
    .sort({ submittedAt: -1 })
    .lean();
  return sendSuccess(res, 'Final project submissions fetched successfully.', submissions);
});

const reviewCourseProjectSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { status, feedback } = req.body;
  if (!mongoose.isValidObjectId(submissionId)) return sendError(res, 'Invalid submission id.', 400);
  if (!['accepted', 'changes_requested'].includes(status)) {
    return sendError(res, 'Review status must be accepted or changes_requested.', 400);
  }
  if (typeof feedback !== 'string' || !feedback.trim() || feedback.trim().length > 2000) {
    return sendError(res, 'Review feedback is required and must be 2000 characters or fewer.', 400);
  }

  const submission = await CourseProjectSubmission.findById(submissionId);
  if (!submission) return sendError(res, 'Final project submission not found.', 404);

  submission.status = status;
  submission.feedback = feedback.trim();
  submission.reviewedBy = req.user._id;
  submission.reviewedAt = new Date();
  await submission.save();
  return sendSuccess(res, 'Final project review saved successfully.', submission);
});

module.exports = {
  getStudentProject,
  submitStudentProject,
  getCourseProjectSubmissions,
  reviewCourseProjectSubmission,
};
