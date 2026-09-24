const mongoose = require('mongoose');
const { ALL_SESSION_STATUSES, SESSION_STATUS } = require('../config/roles');

const sessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
      index: true,
    },
    start: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    end: {
      type: Date,
      required: [true, 'End time is required'],
      index: true,
    },
    speakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Speaker',
        index: true,
      },
    ],
    track: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ALL_SESSION_STATUSES,
      default: SESSION_STATUS.CONFIRMED,
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

sessionSchema.index({ event: 1, start: 1, end: 1 });
sessionSchema.index({ event: 1, room: 1, start: 1, end: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
