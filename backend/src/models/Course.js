const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['draft', 'coming_soon', 'published', 'archived'],
      default: 'draft',
    },
    duration: {
      type: String,
      default: '4 weeks',
    },
    level: {
      type: String,
      default: 'Beginner',
    },
    technologies: [{ type: String }],
    price: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lessonsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

courseSchema.index({ status: 1, isPublished: 1, createdAt: -1 });
courseSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
