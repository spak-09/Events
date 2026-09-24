const mongoose = require('mongoose');
const { ALL_COUPON_TYPES, COUPON_TYPE } = require('../config/roles');

const couponSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ALL_COUPON_TYPES,
      default: COUPON_TYPE.PERCENT,
    },
    value: {
      type: Number,
      required: [true, 'Coupon discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    maxUses: {
      type: Number,
      default: 100,
      min: [1, 'Max uses must be at least 1'],
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    expiry: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    ticketTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketType',
      },
    ],
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

couponSchema.index({ event: 1, code: 1 }, { unique: true });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
