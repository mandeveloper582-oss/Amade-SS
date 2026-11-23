const User = require('../models/User');
const Project = require('../models/Project');
const Course = require('../models/Course');
const BlogPost = require('../models/BlogPost');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Service = require('../models/Service');
const Lesson = require('../models/Lesson');
const CourseModule = require('../models/CourseModule');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalAdmins,
    totalCourses,
    publishedCourses,
    comingSoonCourses,
    totalEnrollments,
    totalProjects,
    publishedProjects,
    totalServices,
    totalBlogPosts,
    publishedBlogPosts,
    totalMessages,
    newMessages,
    publishedLessons,
    publishedModules,
    enrollmentAnalytics,
    quizAnalytics,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'published', isPublished: true }),
    Course.countDocuments({ status: 'coming_soon' }),
    Enrollment.countDocuments(),
    Project.countDocuments(),
    Project.countDocuments({ isPublished: true }),
    Service.countDocuments(),
    BlogPost.countDocuments(),
    BlogPost.countDocuments({ status: 'published' }),
    Message.countDocuments(),
    Message.countDocuments({ status: 'new' }),
    Lesson.countDocuments({ isPublished: true }),
    CourseModule.countDocuments({ isPublished: true }),
    Enrollment.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageProgress: { $avg: '$progress' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]),
    QuizAttempt.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageScore: { $avg: '$score' },
          passed: { $sum: { $cond: ['$passed', 1, 0] } },
        },
      },
    ]),
  ]);
  const enrollmentStats = enrollmentAnalytics[0] || { count: 0, averageProgress: 0, completed: 0 };
  const quizStats = quizAnalytics[0] || { count: 0, averageScore: 0, passed: 0 };

  const recentEnrollments = await Enrollment.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'name email role')
    .populate('course', 'title slug');

  const recentMessages = await Message.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentUsers = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return sendSuccess(res, 'Dashboard statistics fetched successfully.', {
    totalUsers,
    totalStudents,
    totalAdmins,
    totalCourses,
    publishedCourses,
    comingSoonCourses,
    totalEnrollments,
    totalProjects,
    publishedProjects,
    totalServices,
    totalBlogPosts,
    publishedBlogPosts,
    totalMessages,
    newMessages,
    publishedLessons,
    publishedModules,
    averageCourseProgress: Number((enrollmentStats.averageProgress || 0).toFixed(1)),
    courseCompletionRate: enrollmentStats.count
      ? Number(((enrollmentStats.completed / enrollmentStats.count) * 100).toFixed(1))
      : 0,
    quizAttempts: quizStats.count,
    averageQuizScore: Number((quizStats.averageScore || 0).toFixed(1)),
    quizPassRate: quizStats.count ? Number(((quizStats.passed / quizStats.count) * 100).toFixed(1)) : 0,
    recentEnrollments,
    recentMessages,
    recentUsers,
  });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const [recentUsers, recentEnrollments, recentMessages] = await Promise.all([
    User.find({}).select('-password').sort({ createdAt: -1 }).limit(5).lean(),
    Enrollment.find({}).sort({ createdAt: -1 }).limit(5).populate('student', 'name email').populate('course', 'title slug').lean(),
    Message.find({}).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return sendSuccess(res, 'Recent dashboard activity fetched successfully.', {
    recentUsers,
    recentEnrollments,
    recentMessages,
  });
});

module.exports = { getStats, getRecentActivity };
