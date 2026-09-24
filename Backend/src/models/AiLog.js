const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'AI operation type is required'],
      index: true,
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
    },
    output: {
      type: String,
      required: [true, 'Output is required'],
    },
    provider: {
      type: String,
      default: 'template',
    },
    tokens: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
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

const AiLog = mongoose.model('AiLog', aiLogSchema);

module.exports = AiLog;
