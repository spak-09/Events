const mongoose = require('mongoose');
const { ALL_ORG_PLANS, ALL_ORG_STATUSES, ORG_PLANS, ORG_STATUS } = require('../config/roles');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ALL_ORG_PLANS,
      default: ORG_PLANS.STARTER,
      index: true,
    },
    status: {
      type: String,
      enum: ALL_ORG_STATUSES,
      default: ORG_STATUS.ACTIVE,
      index: true,
    },
    settings: {
      maxEvents: {
        type: Number,
        default: 5,
        min: 1,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      allowPublicRegistration: {
        type: Boolean,
        default: true,
      },
      defaultTimezone: {
        type: String,
        default: 'UTC',
      },
      features: {
        type: [String],
        default: ['basic_analytics', 'standard_support'],
      },
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

// Auto-generate slug from name if not provided
organizationSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
