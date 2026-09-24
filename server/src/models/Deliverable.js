const mongoose = require('mongoose');
const { ALL_DELIVERABLE_STATUSES, DELIVERABLE_STATUS } = require('../config/roles');

const deliverableSchema = new mongoose.Schema(
  {
    sponsorship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsorship',
      required: [true, 'Sponsorship is required'],
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Deliverable title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ALL_DELIVERABLE_STATUSES,
      default: DELIVERABLE_STATUS.PENDING,
      index: true,
    },
    asset: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
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

deliverableSchema.index({ sponsorship: 1, status: 1 });
deliverableSchema.index({ event: 1, status: 1 });

const Deliverable = mongoose.model('Deliverable', deliverableSchema);

module.exports = Deliverable;
