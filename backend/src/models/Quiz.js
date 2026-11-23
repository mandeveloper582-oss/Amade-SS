const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false'],
      default: 'multiple_choice',
    },
    options: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return value.length >= 2;
        },
        message: 'Each quiz question must include at least two answer options.',
      },
    },
    correctOptionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true },
);

const quizSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: 'Lesson quiz',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
    },
    passScore: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: 'A quiz must contain at least one question.',
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Quiz', quizSchema);
