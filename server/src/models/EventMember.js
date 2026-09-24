const mongoose = require('mongoose');
const { ALL_EVENT_ROLES, EVENT_MEMBER_STATUS } = require('../config/roles');

const eventMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ALL_EVENT_ROLES,
      required: [true, 'Event role is required'],
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(EVENT_MEMBER_STATUS),
      default: EVENT_MEMBER_STATUS.ACTIVE,
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

// Enforce unique role assignment per user per event
eventMemberSchema.index({ user: 1, event: 1 }, { unique: true });

const EventMember = mongoose.model('EventMember', eventMemberSchema);

module.exports = EventMember;
