const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { isLessonUnlocked } = require('../utils/lessonAccess');

const ensureLessonAccess = async (studentId, lessonId) => {
  const lesson = await Lesson.findById(lessonId).select('course module isPublished');
  if (!lesson) {
    return { error: 'Lesson not found.', statusCode: 404 };
  }
  if (!lesson.isPublished) {
    return { error: 'Lesson not found.', statusCode: 404 };
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: lesson.course,
    status: { $in: ['active', 'completed'] },
  });

  if (!enrollment) {
    return { error: 'You are not enrolled in this course.', statusCode: 403 };
  }
  if (!(await isLessonUnlocked(lesson, enrollment))) {
    return { error: 'Complete the previous lesson before accessing this lesson.', statusCode: 403 };
  }

  return { lesson, enrollment };
};

const sanitizeQuizForStudent = (quiz) => {
  if (!quiz) {
    return null;
  }

  return {
    ...quiz,
    questions: (quiz.questions || []).map(({ _id, prompt, type, options }) => ({
      _id,
      prompt,
      type,
      options,
    })),
  };
};

const normalizeQuestion = (question) => {
  const prompt = String(question?.prompt || '').trim();
  if (!prompt) {
    throw new Error('Every quiz question must include a prompt.');
  }

  const safeOptions = Array.isArray(question?.options)
    ? question.options.map((option) => String(option).trim()).filter(Boolean)
    : [];

  if (safeOptions.length !== 4) {
    throw new Error('Every question must include exactly four answer options.');
  }

  if (question?.correctOptionIndex === undefined || question?.correctOptionIndex === null) {
    throw new Error('Each question must identify one of its answer options as correct.');
  }
  const correctIndex = Number(question.correctOptionIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= safeOptions.length) {
    throw new Error('Each question must identify one of its answer options as correct.');
  }

  return {
    prompt,
    type: question?.type === 'true_false' ? 'true_false' : 'multiple_choice',
    options: safeOptions,
    correctOptionIndex: correctIndex,
  };
};

const getQuiz = asyncHandler(async (req, res) => {
  const lessonId = req.params.lessonId;
  if (!mongoose.isValidObjectId(lessonId)) {
    return sendError(res, 'Invalid lesson id.', 400);
  }

  if (req.user.role === 'student') {
    const access = await ensureLessonAccess(req.user._id, lessonId);
    if (access.error) {
      return sendError(res, access.error, access.statusCode);
    }
  }

  const quiz = await Quiz.findOne({ lesson: lessonId }).lean();
  if (!quiz) {
    return sendSuccess(res, 'Quiz not found.', null);
  }

  const isStudentView = req.user?.role === 'student';
  const safeQuiz = isStudentView ? sanitizeQuizForStudent(quiz) : quiz;
  return sendSuccess(res, 'Quiz fetched successfully.', safeQuiz);
});

const createOrUpdateQuiz = asyncHandler(async (req, res) => {
  const lessonId = req.params.lessonId || req.body.lessonId;
  if (!mongoose.isValidObjectId(lessonId)) {
    return sendError(res, 'Invalid lesson id.', 400);
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return sendError(res, 'Lesson not found.', 404);
  }

  let questions;
  try {
    questions = Array.isArray(req.body.questions) ? req.body.questions.map(normalizeQuestion) : [];
  } catch (error) {
    return sendError(res, error.message, 400);
  }
  if (questions.length !== 5) {
    return sendError(res, 'Each lesson quiz must include exactly five questions.', 400);
  }

  const payload = {
    lesson: lessonId,
    title: String(req.body.title || 'Lesson quiz').trim() || 'Lesson quiz',
    instructions: String(req.body.instructions || '').trim(),
    passScore: Number(req.body.passScore ?? 80),
    questions,
  };

  if (payload.passScore < 0 || payload.passScore > 100) {
    return sendError(res, 'Quiz pass score must be between 0 and 100.', 400);
  }

  const quiz = await Quiz.findOneAndUpdate(
    { lesson: lessonId },
    payload,
    { new: true, upsert: true, runValidators: true },
  );

  return sendSuccess(res, 'Quiz saved successfully.', quiz, 201);
});

const submitQuizAttempt = asyncHandler(async (req, res) => {
  const lessonId = req.params.lessonId;
  if (!mongoose.isValidObjectId(lessonId)) {
    return sendError(res, 'Invalid lesson id.', 400);
  }

  const access = await ensureLessonAccess(req.user._id, lessonId);
  if (access.error) {
    return sendError(res, access.error, access.statusCode);
  }
  const { lesson, enrollment } = access;
  const quiz = await Quiz.findOne({ lesson: lessonId });
  if (!quiz) {
    return sendError(res, 'No quiz is available for this lesson.', 404);
  }

  const answerEntries = Array.isArray(req.body.answers) ? req.body.answers : [];
  if (answerEntries.length !== quiz.questions.length) {
    return sendError(res, `Please answer all ${quiz.questions.length} questions before submitting.`, 400);
  }
  if (answerEntries.some((answer) => !answer || typeof answer !== 'object')) {
    return sendError(res, 'Each answer must include a question id and selected option.', 400);
  }

  const answeredQuestionIds = new Set();
  const normalizedAnswers = answerEntries.map((answer) => {
    const question = quiz.questions.find((item) => String(item._id) === String(answer.questionId));
    if (
      !question
      || answer.selectedIndex === undefined
      || answer.selectedIndex === null
      || answeredQuestionIds.has(String(question._id))
    ) {
      return null;
    }
    answeredQuestionIds.add(String(question._id));

    const selectedIndex = answer.selectedIndex;
    if (typeof selectedIndex !== 'number' || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
      return null;
    }
    const isCorrect = selectedIndex === question.correctOptionIndex;
    return {
      questionId: String(question._id),
      selectedIndex,
      isCorrect,
    };
  });
  if (normalizedAnswers.some((answer) => answer === null) || answeredQuestionIds.size !== quiz.questions.length) {
    return sendError(res, 'Answers must include one valid option for every quiz question.', 400);
  }

  const correctCount = normalizedAnswers.filter((answer) => answer.isCorrect).length;
  const percentage = quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  const passed = percentage >= quiz.passScore;

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    lesson: lesson._id,
    student: req.user._id,
    course: lesson.course,
    score: percentage,
    points: correctCount,
    maxScore: quiz.questions.length,
    passed,
    answers: normalizedAnswers,
  });

  if (passed) {
    const completed = new Set(enrollment.completedLessons.map((id) => id.toString()));
    completed.add(lessonId);
    enrollment.completedLessons = Array.from(completed);
    const publishedLessons = await Lesson.find({ course: lesson.course, isPublished: true }).select('_id').lean();
    const publishedLessonIds = new Set(publishedLessons.map(({ _id }) => _id.toString()));
    const completedPublishedLessons = enrollment.completedLessons.filter((completedLessonId) => publishedLessonIds.has(completedLessonId.toString()));
    enrollment.progress = publishedLessons.length > 0
      ? Math.min(100, Math.round((completedPublishedLessons.length / publishedLessons.length) * 100))
      : 0;

    if (enrollment.progress >= 100) {
      const courseQuizLessonIds = (await Quiz.find({
        lesson: { $in: Array.from(publishedLessonIds) },
      }).select('lesson').lean()).map(({ lesson }) => lesson);
      let allQuizzesPassed = true;
      if (courseQuizLessonIds.length) {
        const passedLessonIds = new Set((await QuizAttempt.distinct('lesson', {
          student: req.user._id,
          lesson: { $in: courseQuizLessonIds },
          passed: true,
        })).map(String));
        allQuizzesPassed = courseQuizLessonIds.every((quizLessonId) => (
          passedLessonIds.has(String(quizLessonId))
        ));
      }
      enrollment.status = allQuizzesPassed ? 'completed' : 'active';
    } else {
      enrollment.status = 'active';
    }
    enrollment.completedAt = enrollment.status === 'completed' ? new Date() : null;
    await enrollment.save();
  }

  return sendSuccess(res, passed ? 'Quiz passed! Lesson unlocked.' : 'Quiz submitted. Review your results and try again.', {
    attempt,
    passed,
    score: percentage,
    points: correctCount,
    maxScore: quiz.questions.length,
    passScore: quiz.passScore,
  });
});

const getQuizAttemptHistory = asyncHandler(async (req, res) => {
  const lessonId = req.params.lessonId;
  if (!mongoose.isValidObjectId(lessonId)) {
    return sendError(res, 'Invalid lesson id.', 400);
  }

  const access = await ensureLessonAccess(req.user._id, lessonId);
  if (access.error) {
    return sendError(res, access.error, access.statusCode);
  }
  const { lesson } = access;
  const attempts = await QuizAttempt.find({ lesson: lessonId, student: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 'Quiz attempts fetched successfully.', {
    lessonId: lesson._id,
    attempts,
  });
});

module.exports = {
  getQuiz,
  createOrUpdateQuiz,
  submitQuizAttempt,
  getQuizAttemptHistory,
};
