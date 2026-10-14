const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

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

  return sendSuccess(res, 'Lesson fetched successfully.', lesson);
});

const createLesson = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId || req.body.course;
  const { title, description, content, videoUrl, resources, order, isPublished } = req.body;

  const courseExists = await Course.findById(courseId);
  if (!courseExists) {
    return sendError(res, 'Course not found.', 404);
  }

  const lesson = await Lesson.create({
    course: courseId,
    title,
    description,
    content,
    videoUrl,
    resources,
    order,
    isPublished: isPublished !== undefined ? isPublished : true,
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

  Object.assign(lesson, req.body);
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

  const courseId = lesson.course;
  await lesson.deleteOne();

  const course = await Course.findById(courseId);
  if (course) {
    course.lessonsCount = await Lesson.countDocuments({ course: courseId });
    await course.save();
  }

  return sendSuccess(res, 'Lesson deleted successfully.');
});

module.exports = { getLessons, getLessonById, createLesson, updateLesson, deleteLesson };
