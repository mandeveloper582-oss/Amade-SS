const mongoose = require('mongoose');

const courseProjectSubmissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    repositoryUrl: {
      type: String,
      trim: true,
      default: '',
    },
    demoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'accepted', 'changes_requested'],
      default: 'submitted',
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

courseProjectSubmissionSchema.index({ student: 1, course: 1 }, { unique: true });
courseProjectSubmissionSchema.index({ course: 1, status: 1, submittedAt: -1 });

module.exports = mongoose.model('CourseProjectSubmission', courseProjectSubmissionSchema);
