const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { isLessonUnlocked } = require('../utils/lessonAccess');

const getLessons = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.courseId) {
    filter.course = req.query.courseId;
  }

  const lessons = await Lesson.find(filter).sort({ course: 1, order: 1 });
  return sendSuccess(res, 'Lessons fetched successfully.', lessons);
});

const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate('course');
  if (!lesson) {
    return sendError(res, 'Lesson not found.', 404);
  }

  if (req.user.role === 'student') {
    if (!lesson.isPublished) {
      return sendError(res, 'Lesson not found.', 404);
    }

    const courseId = lesson.course?._id;
    if (!courseId) {
      return sendError(res, 'Course not found.', 404);
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ['active', 'completed'] },
    });
    if (!enrollment) {
      return sendError(res, 'You are not enrolled in this course.', 403);
    }
    if (!(await isLessonUnlocked(lesson, enrollment))) {
      return sendError(res, 'Complete the previous lesson before accessing this lesson.', 403);
    }
  }

  if (req.user.role === 'student') {
    const lessonData = lesson.toObject();
    delete lessonData.pdfPath;
    delete lessonData.pdfStorageId;
    lessonData.pdfUrl = lesson.pdfStorageId ? `/uploads/pdf/${lesson.pdfStorageId}` : '';
    return sendSuccess(res, 'Lesson fetched successfully.', lessonData);
  }

  return sendSuccess(res, 'Lesson fetched successfully.', lesson);
});

const createLesson = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId || req.body.course;
  const {
    title,
    module,
    description,
    content,
    englishContent,
    oromoSummary,
    codeExamples,
    exercises,
    videoUrl,
    resources,
    order,
    isPublished,
    pdfName,
    pdfPath,
    pdfStorageId,
    pdfMimeType,
    pdfSize,
    learningObjectives,
    quizPassingScore,
  } = req.body;

  const courseExists = await Course.findById(courseId);
  if (!courseExists) {
    return sendError(res, 'Course not found.', 404);
  }
  if (module) {
    const moduleExists = await CourseModule.exists({ _id: module, course: courseId });
    if (!moduleExists) {
      return sendError(res, 'Module not found in this course.', 400);
    }
  }

  const lesson = await Lesson.create({
    course: courseId,
    module: module || null,
    title,
    description,
    content,
    englishContent,
    oromoSummary,
    codeExamples,
    exercises,
    videoUrl,
    resources,
    order,
    isPublished: isPublished !== undefined ? isPublished : true,
    pdfName,
    pdfPath,
    pdfStorageId,
    pdfMimeType,
    pdfSize,
    learningObjectives,
    quizPassingScore,
  });

  courseExists.lessonsCount = await Lesson.countDocuments({ course: courseId });
  await courseExists.save();

  return sendSuccess(res, 'Lesson created successfully.', lesson, 201);
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    return sendError(res, 'Lesson not found.', 404);
  }

  const allowedFields = [
    'title',
    'module',
    'description',
    'content',
    'englishContent',
    'oromoSummary',
    'codeExamples',
    'exercises',
    'videoUrl',
    'resources',
    'order',
    'isPublished',
    'pdfName',
    'pdfPath',
    'pdfStorageId',
    'pdfMimeType',
    'pdfSize',
    'learningObjectives',
    'quizPassingScore',
  ];

  if (req.body.module !== undefined && req.body.module !== null && req.body.module !== '') {
    const moduleExists = await CourseModule.exists({ _id: req.body.module, course: lesson.course });
    if (!moduleExists) {
      return sendError(res, 'Module not found in this course.', 400);
    }
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      lesson[field] = field === 'module' && !req.body[field] ? null : req.body[field];
    }
  });

  await lesson.save();

  const course = await Course.findById(lesson.course);
  if (course) {
    course.lessonsCount = await Lesson.countDocuments({ course: lesson.course });
    await course.save();
  }

  return sendSuccess(res, 'Lesson updated successfully.', lesson);
});

const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    return sendError(res, 'Lesson not found.', 404);
  }

  const [hasAttempts, hasCompletionRecords] = await Promise.all([
    QuizAttempt.exists({ lesson: lesson._id }),
    Enrollment.exists({ completedLessons: lesson._id }),
  ]);
  if (hasAttempts || hasCompletionRecords) {
    return sendError(res, 'This lesson has student progress or quiz attempts. Unpublish it instead to preserve learning records.', 409);
  }

  const courseId = lesson.course;
  await Quiz.deleteOne({ lesson: lesson._id });
  await lesson.deleteOne();

  const course = await Course.findById(courseId);
  if (course) {
    course.lessonsCount = await Lesson.countDocuments({ course: courseId });
    await course.save();
  }

  const [publishedLessonCount, enrollments] = await Promise.all([
    Lesson.countDocuments({ course: courseId, isPublished: true }),
    Enrollment.find({ course: courseId, status: { $in: ['active', 'completed'] } }),
  ]);
  await Promise.all(enrollments.map(async (enrollment) => {
    const completedCount = enrollment.completedLessons.filter((completedLessonId) => (
      String(completedLessonId) !== String(lesson._id)
    )).length;
    enrollment.progress = publishedLessonCount
      ? Math.min(100, Math.round((completedCount / publishedLessonCount) * 100))
      : 0;
    enrollment.status = enrollment.progress >= 100 ? 'completed' : 'active';
    enrollment.completedAt = enrollment.status === 'completed' ? enrollment.completedAt || new Date() : null;
    await enrollment.save();
  }));

  return sendSuccess(res, 'Lesson deleted successfully.');
});

module.exports = { getLessons, getLessonById, createLesson, updateLesson, deleteLesson };
