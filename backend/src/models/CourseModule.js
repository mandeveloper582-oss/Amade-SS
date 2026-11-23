const mongoose = require('mongoose');

const courseModuleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

courseModuleSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('CourseModule', courseModuleSchema);
