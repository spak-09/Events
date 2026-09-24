const mongoose = require('mongoose');
const { ALL_EVENT_STATUSES, EVENT_STATUS } = require('../config/roles');

const policiesSchema = new mongoose.Schema(
  {
    refundPolicy: { type: String, default: '' },
    codeOfConduct: { type: String, default: '' },
    ageRestriction: { type: Number, default: 0, min: 0 },
    privacyPolicy: { type: String, default: '' },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ALL_EVENT_STATUSES,
      default: EVENT_STATUS.DRAFT,
      index: true,
    },
    banner: {
      type: String,
      default: null,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      default: 100,
    },
    policies: {
      type: policiesSchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-generate slug if missing
eventSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-') +
      '-' +
      randomSuffix;
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
