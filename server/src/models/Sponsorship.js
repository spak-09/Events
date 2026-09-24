const mongoose = require('mongoose');
const { ALL_SPONSORSHIP_STATUSES, SPONSORSHIP_STATUS } = require('../config/roles');

const sponsorshipSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sponsor user is required'],
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: null,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorPackage',
      required: [true, 'SponsorPackage is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ALL_SPONSORSHIP_STATUSES,
      default: SPONSORSHIP_STATUS.CONFIRMED,
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

sponsorshipSchema.index({ event: 1, sponsor: 1 });

const Sponsorship = mongoose.model('Sponsorship', sponsorshipSchema);

module.exports = Sponsorship;
