const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
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
    shortDescription: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    startingPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    icon: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    features: [{ type: String }],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

serviceSchema.pre('save', function syncServiceFlags(next) {
  if (this.isModified('isPublished') && this.isActive === undefined) {
    this.isActive = this.isPublished;
  }

  if (this.isModified('isActive') && this.isPublished === undefined) {
    this.isPublished = this.isActive;
  }

  if (this.isPublished === undefined) {
    this.isPublished = this.isActive ?? true;
  }

  if (this.isActive === undefined) {
    this.isActive = this.isPublished ?? true;
  }

  next();
});

serviceSchema.index({ isPublished: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Service', serviceSchema);
