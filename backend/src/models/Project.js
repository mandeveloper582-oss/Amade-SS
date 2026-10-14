const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
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
    overview: {
      type: String,
      default: '',
    },
    problem: {
      type: String,
      default: '',
    },
    solution: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    gallery: [{ type: String }],
    category: {
      type: String,
      default: 'General',
    },
    technologies: [{ type: String }],
    features: [{ type: String }],
    liveDemo: {
      type: String,
      default: '',
    },
    github: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ isPublished: 1, isFeatured: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
