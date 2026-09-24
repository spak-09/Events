const mongoose = require('mongoose');
const { ALL_SPONSOR_TIERS, SPONSOR_TIERS } = require('../config/roles');

const sponsorPackageSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    tier: {
      type: String,
      enum: ALL_SPONSOR_TIERS,
      default: SPONSOR_TIERS.GOLD,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    benefits: {
      type: [String],
      default: [],
    },
    slots: {
      type: Number,
      required: [true, 'Slots count is required'],
      min: [1, 'Slots must be at least 1'],
    },
    claimed: {
      type: Number,
      default: 0,
      min: 0,
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

sponsorPackageSchema.index({ event: 1, tier: 1 });

const SponsorPackage = mongoose.model('SponsorPackage', sponsorPackageSchema);

module.exports = SponsorPackage;
