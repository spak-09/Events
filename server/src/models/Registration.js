const mongoose = require('mongoose');
const { ALL_REGISTRATION_STATUSES, REGISTRATION_STATUS } = require('../config/roles');

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    ticketType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketType',
      required: [true, 'TicketType is required'],
      index: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    status: {
      type: String,
      enum: ALL_REGISTRATION_STATUSES,
      default: REGISTRATION_STATUS.APPROVED,
      index: true,
    },
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    qrDataUrl: {
      type: String,
      default: null,
    },
    interests: {
      type: [String],
      default: [],
      index: true,
    },
    selectedSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
      },
    ],
    waitlistPosition: {
      type: Number,
      default: null,
      index: true,
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

registrationSchema.index({ event: 1, user: 1, status: 1 });
registrationSchema.index({ event: 1, ticketType: 1, waitlistPosition: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
