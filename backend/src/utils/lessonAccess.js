const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const CourseModule = require('../models/CourseModule');
const Lesson = require('../models/Lesson');

const buildStudentLessonView = async (lessons, enrollment, studentId) => {
  const lessonIds = lessons.map((lesson) => lesson._id);
  const moduleIds = lessons.map((lesson) => lesson.module).filter(Boolean);
  const [quizzes, attempts, modules] = await Promise.all([
    lessonIds.length
      ? Quiz.find({ lesson: { $in: lessonIds } }).select('lesson title instructions passScore questions').lean()
      : [],
    lessonIds.length
      ? QuizAttempt.find({ student: studentId, lesson: { $in: lessonIds } })
          .sort({ createdAt: -1 })
          .lean()
      : [],
    moduleIds.length
      ? CourseModule.find({ _id: { $in: moduleIds }, isPublished: true }).select('_id title order').lean()
      : [],
  ]);
  const quizByLesson = new Map(quizzes.map((quiz) => [String(quiz.lesson), quiz]));
  const publishedModuleById = new Map(modules.map((module) => [String(module._id), module]));
  const latestAttemptByLesson = new Map();
  attempts.forEach((attempt) => {
    const key = String(attempt.lesson);
    if (!latestAttemptByLesson.has(key)) {
      latestAttemptByLesson.set(key, attempt);
    }
  });
  const completedLessonIds = new Set(enrollment.completedLessons.map(String));

  return lessons.map((lesson, index) => {
    const lessonId = String(lesson._id);
    const previousLesson = index > 0 ? lessons[index - 1] : null;
    const previousLessonId = previousLesson ? String(previousLesson._id) : null;
    const previousQuiz = previousLessonId ? quizByLesson.get(previousLessonId) : null;
    const previousAttempt = previousLessonId ? latestAttemptByLesson.get(previousLessonId) : null;
    const previousModuleIsAvailable = !previousLesson?.module
      || publishedModuleById.has(String(previousLesson.module));
    const previousLessonPassed = previousModuleIsAvailable && (
      completedLessonIds.has(previousLessonId)
      || Boolean(previousQuiz && previousAttempt?.passed)
    );
    const module = lesson.module ? publishedModuleById.get(String(lesson.module)) : null;
    const moduleIsAvailable = !lesson.module || Boolean(module);
    const isLocked = !moduleIsAvailable || (index > 0 && !previousLessonPassed);
    const attempt = latestAttemptByLesson.get(lessonId) || null;
    const quiz = quizByLesson.get(lessonId) || null;
    const visibleQuiz = quiz
      ? {
          ...quiz,
          questions: (quiz.questions || []).map(({ _id, prompt, type, options }) => ({
            _id,
            prompt,
            type,
            options,
          })),
        }
      : null;
    const visibleLesson = { ...lesson };

    if (isLocked) {
      [
        'content',
        'englishContent',
        'introduction',
        'stepByStep',
        'practicalExamples',
        'expectedOutput',
        'importantPoints',
        'oromoSummary',
        'codeExamples',
        'exercises',
        'videoUrl',
        'resources',
        'learningObjectives',
        'pdfName',
        'pdfPath',
        'pdfMimeType',
        'pdfSize',
        'pdfStorageId',
      ].forEach(
        (field) => delete visibleLesson[field],
      );
    }

    return {
      ...visibleLesson,
      moduleTitle: module?.title || '',
      moduleOrder: module?.order || null,
      pdfUrl: !isLocked && visibleLesson.pdfStorageId ? `/uploads/pdf/${visibleLesson.pdfStorageId}` : '',
      pdfAvailable: !isLocked && Boolean(visibleLesson.pdfStorageId),
      pdfPath: undefined,
      pdfStorageId: undefined,
      quiz: isLocked ? null : visibleQuiz,
      lastQuizAttempt: !isLocked && attempt
        ? {
            score: attempt.score,
            points: attempt.points,
            maxScore: attempt.maxScore,
            passed: attempt.passed,
            createdAt: attempt.createdAt,
          }
        : null,
      isLocked,
      status: completedLessonIds.has(lessonId)
        ? 'completed'
        : isLocked
          ? 'locked'
          : attempt?.passed
            ? 'quiz_passed'
            : attempt
              ? 'quiz_failed'
              : 'available',
      canAccess: !isLocked,
    };
  });
};

const isLessonUnlocked = async (lesson, enrollment) => {
  if (!lesson.isPublished) {
    return false;
  }

  const courseId = lesson.course?._id || lesson.course;
  if (lesson.module && !(await CourseModule.exists({ _id: lesson.module, course: courseId, isPublished: true }))) {
    return false;
  }
  const lessons = await Lesson.find({ course: courseId, isPublished: true })
    .sort({ order: 1, _id: 1 })
    .select('_id module')
    .lean();
  const lessonIndex = lessons.findIndex((item) => String(item._id) === String(lesson._id));

  if (lessonIndex < 0 || lessonIndex === 0) {
    return lessonIndex === 0;
  }

  const previousLessonId = lessons[lessonIndex - 1]._id;
  const previousLesson = lessons[lessonIndex - 1];
  if (previousLesson.module && !(await CourseModule.exists({
    _id: previousLesson.module,
    course: courseId,
    isPublished: true,
  }))) {
    return false;
  }
  const completedLessonIds = new Set(enrollment.completedLessons.map(String));
  if (completedLessonIds.has(String(previousLessonId))) {
    return true;
  }

  return false;
};

module.exports = { buildStudentLessonView, isLessonUnlocked };
