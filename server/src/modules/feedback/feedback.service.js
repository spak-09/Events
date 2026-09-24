const Feedback = require('../../models/Feedback');
const Registration = require('../../models/Registration');
const Session = require('../../models/Session');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');
const { REGISTRATION_STATUS } = require('../../config/roles');

const submitFeedback = async (eventId, userId, { sessionId, rating, comment }) => {
  // Attendee verification: user must have an active or checked-in registration for this event
  const registration = await Registration.findOne({
    event: eventId,
    user: userId,
    status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN] },
  });

  if (!registration) {
    throw ApiError.forbidden('Only confirmed or checked-in attendees may submit event or session feedback');
  }

  // Validate session if provided
  if (sessionId) {
    const session = await Session.findOne({ _id: sessionId, event: eventId });
    if (!session) {
      throw ApiError.notFound('Session not found for this event');
    }

    const existingFeedback = await Feedback.findOne({
      event: eventId,
      session: sessionId,
      user: userId,
    });

    if (existingFeedback) {
      throw ApiError.conflict('You have already submitted feedback for this session');
    }
  } else {
    const existingGeneralFeedback = await Feedback.findOne({
      event: eventId,
      session: null,
      user: userId,
    });

    if (existingGeneralFeedback) {
      throw ApiError.conflict('You have already submitted overall event feedback');
    }
  }

  const feedback = await Feedback.create({
    event: eventId,
    session: sessionId || null,
    user: userId,
    rating,
    comment: comment || '',
  });

  await AuditLog.create({
    user: userId,
    action: 'FEEDBACK_SUBMITTED',
    resource: 'Feedback',
    resourceId: feedback._id.toString(),
    details: { eventId, sessionId, rating },
  });

  return feedback;
};

const listFeedback = async (eventId, queryParams) => {
  const filter = { event: eventId };

  if (queryParams.session) {
    filter.session = queryParams.session;
  }

  return paginateQuery(Feedback, filter, queryParams, {
    populate: [
      { path: 'user', select: 'name email avatar' },
      { path: 'session', select: 'title room start' },
    ],
  });
};

const getFeedbackSummary = async (eventId) => {
  const stats = await Feedback.aggregate([
    { $match: { event: eventId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalResponses: { $sum: 1 },
        ratingCounts: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalResponses: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const ratingCounts = stats[0].ratingCounts || [];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingCounts.forEach((r) => {
    if (distribution[r] !== undefined) distribution[r]++;
  });

  return {
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    totalResponses: stats[0].totalResponses,
    distribution,
  };
};

module.exports = {
  submitFeedback,
  listFeedback,
  getFeedbackSummary,
};
