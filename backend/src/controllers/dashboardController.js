const User = require('../models/User');
const Project = require('../models/Project');
const Course = require('../models/Course');
const BlogPost = require('../models/BlogPost');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Service = require('../models/Service');
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
  ]);

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
