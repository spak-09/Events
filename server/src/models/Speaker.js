const mongoose = require('mongoose');

const speakerAvailabilitySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, default: '09:00' }, // e.g. "09:00"
    endTime: { type: String, default: '17:00' },   // e.g. "17:00"
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const speakerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    photo: {
      type: String,
      default: null,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    links: {
      website: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
    },
    expertise: {
      type: [String],
      default: [],
      index: true,
    },
    availability: [speakerAvailabilitySchema],
    isActive: {
      type: Boolean,
      default: true,
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

const Speaker = mongoose.model('Speaker', speakerSchema);

module.exports = Speaker;
