const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    englishContent: {
      type: String,
      default: '',
    },
    oromoSummary: {
      type: String,
      default: '',
    },
    codeExamples: {
      type: String,
      default: '',
    },
    exercises: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    resources: [{ type: String }],
    learningObjectives: [{ type: String }],
    pdfName: {
      type: String,
      default: '',
    },
    pdfPath: {
      type: String,
      default: '',
    },
    pdfStorageId: {
      type: String,
      default: '',
    },
    pdfMimeType: {
      type: String,
      default: 'application/pdf',
    },
    pdfSize: {
      type: Number,
      default: 0,
    },
    quizPassingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    order: {
      type: Number,
      default: 1,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
