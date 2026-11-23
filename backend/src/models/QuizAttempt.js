const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
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
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    maxScore: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        selectedIndex: {
          type: Number,
          required: true,
          min: 0,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ student: 1, lesson: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
