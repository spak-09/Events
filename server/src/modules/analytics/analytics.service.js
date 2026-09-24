const mongoose = require('mongoose');
const Registration = require('../../models/Registration');
const Session = require('../../models/Session');
const SessionAttendance = require('../../models/SessionAttendance');
const Feedback = require('../../models/Feedback');
const Deliverable = require('../../models/Deliverable');
const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const User = require('../../models/User');
const Sponsorship = require('../../models/Sponsorship');
const ApiError = require('../../utils/ApiError');
const { REGISTRATION_STATUS } = require('../../config/roles');

/**
 * Event-scoped analytics computed via high-performance MongoDB aggregation pipelines.
 */
const getEventAnalytics = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const eventObjectId = new mongoose.Types.ObjectId(eventId);

  // 1. Registrations Over Time (daily timeline)
  const registrationsOverTime = await Registration.aggregate([
    { $match: { event: eventObjectId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $in: ['$status', [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN]] }, 1, 0] },
        },
        checkedIn: {
          $sum: { $cond: [{ $eq: ['$status', REGISTRATION_STATUS.CHECKED_IN] }, 1, 0] },
        },
        waitlisted: {
          $sum: { $cond: [{ $eq: ['$status', REGISTRATION_STATUS.WAITLISTED] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', REGISTRATION_STATUS.CANCELLED] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        total: 1,
        approved: 1,
        checkedIn: 1,
        waitlisted: 1,
        cancelled: 1,
        _id: 0,
      },
    },
  ]);

  // 2. Ticket Mix & Revenue
  const ticketMixAggregation = await Registration.aggregate([
    {
      $match: {
        event: eventObjectId,
        status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN] },
      },
    },
    {
      $group: {
        _id: '$ticketType',
        soldCount: { $sum: 1 },
        revenue: { $sum: '$finalPrice' },
      },
    },
    {
      $lookup: {
        from: 'tickettypes',
        localField: '_id',
        foreignField: '_id',
        as: 'ticketDetails',
      },
    },
    { $unwind: { path: '$ticketDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        ticketTypeId: '$_id',
        name: { $ifNull: ['$ticketDetails.name', 'Standard'] },
        basePrice: { $ifNull: ['$ticketDetails.price', 0] },
        soldCount: 1,
        revenue: { $round: ['$revenue', 2] },
        _id: 0,
      },
    },
  ]);

  const totalRevenue = ticketMixAggregation.reduce((acc, curr) => acc + curr.revenue, 0);

  // 3. Check-In Rate
  const totalApprovedOrCheckedIn = await Registration.countDocuments({
    event: eventId,
    status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN] },
  });
  const totalCheckedIn = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.CHECKED_IN,
  });
  const checkInRatePercentage = totalApprovedOrCheckedIn > 0
    ? Math.round((totalCheckedIn / totalApprovedOrCheckedIn) * 100)
    : 0;

  // 4. Session Popularity vs Capacity
  const sessions = await Session.find({ event: eventId }).select('title room capacity track start end');
  const sessionPopularity = [];

  for (const s of sessions) {
    const [selectedCount, attendedCount] = await Promise.all([
      Registration.countDocuments({ event: eventId, selectedSessions: s._id }),
      SessionAttendance.countDocuments({ session: s._id }),
    ]);

    sessionPopularity.push({
      sessionId: s._id,
      title: s.title,
      room: s.room,
      capacity: s.capacity,
      selectedCount,
      attendedCount,
      attendanceRatePercentage: s.capacity > 0 ? Math.round((attendedCount / s.capacity) * 100) : 0,
    });
  }

  // 5. Feedback Average & Distribution
  const feedbackAgg = await Feedback.aggregate([
    { $match: { event: eventObjectId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalResponses: { $sum: 1 },
        ratingsList: { $push: '$rating' },
      },
    },
  ]);

  const feedbackData = {
    averageRating: 0,
    totalResponses: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  if (feedbackAgg.length > 0) {
    feedbackData.averageRating = Math.round(feedbackAgg[0].averageRating * 10) / 10;
    feedbackData.totalResponses = feedbackAgg[0].totalResponses;
    (feedbackAgg[0].ratingsList || []).forEach((r) => {
      if (feedbackData.distribution[r] !== undefined) feedbackData.distribution[r]++;
    });
  }

  // 6. Sponsor Deliverable Completion %
  const deliverableAgg = await Deliverable.aggregate([
    { $match: { event: eventObjectId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  let totalDeliverables = 0;
  let approvedDeliverables = 0;
  let submittedDeliverables = 0;
  let pendingDeliverables = 0;

  deliverableAgg.forEach((d) => {
    totalDeliverables += d.count;
    if (d._id === 'approved') approvedDeliverables += d.count;
    if (d._id === 'submitted') submittedDeliverables += d.count;
    if (d._id === 'pending') pendingDeliverables += d.count;
  });

  const deliverableCompletionPercentage = totalDeliverables > 0
    ? Math.round((approvedDeliverables / totalDeliverables) * 100)
    : 0;

  return {
    eventId,
    title: event.title,
    registrationsOverTime,
    ticketMix: {
      breakdown: ticketMixAggregation,
      totalGrossRevenue: Math.round(totalRevenue * 100) / 100,
    },
    checkInStats: {
      totalApproved: totalApprovedOrCheckedIn,
      totalCheckedIn,
      checkInRatePercentage,
    },
    sessionPopularity,
    feedback: feedbackData,
    sponsorshipDeliverables: {
      totalDeliverables,
      approvedDeliverables,
      submittedDeliverables,
      pendingDeliverables,
      completionRatePercentage: deliverableCompletionPercentage,
    },
  };
};

/**
 * Platform-wide analytics for Platform Admins
 */
const getPlatformOverview = async () => {
  const [
    totalOrganizations,
    totalEvents,
    eventsByStatus,
    totalUsers,
    totalSessions,
    totalSponsorships,
    revenueAgg,
  ] = await Promise.all([
    Organization.countDocuments(),
    Event.countDocuments(),
    Event.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Session.countDocuments(),
    Sponsorship.countDocuments(),
    Registration.aggregate([
      {
        $match: {
          status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN] },
        },
      },
      {
        $group: {
          _id: null,
          totalTicketsSold: { $sum: 1 },
          grossRevenue: { $sum: '$finalPrice' },
        },
      },
    ]),
  ]);

  const eventStatusMap = {};
  eventsByStatus.forEach((e) => {
    eventStatusMap[e._id] = e.count;
  });

  const revData = revenueAgg.length > 0 ? revenueAgg[0] : { totalTicketsSold: 0, grossRevenue: 0 };

  return {
    totalOrganizations,
    totalEvents,
    eventsByStatus: eventStatusMap,
    totalUsers,
    totalSessions,
    totalSponsorships,
    totalTicketsSold: revData.totalTicketsSold,
    grossPlatformRevenue: Math.round(revData.grossRevenue * 100) / 100,
  };
};

module.exports = {
  getEventAnalytics,
  getPlatformOverview,
};
