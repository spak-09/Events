const Registration = require('../../models/Registration');
const Session = require('../../models/Session');
const SessionAttendance = require('../../models/SessionAttendance');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { REGISTRATION_STATUS } = require('../../config/roles');

/**
 * Idempotent event check-in.
 */
const checkinToEvent = async (eventId, { qrToken, registrationId }, staffUser) => {
  const filter = { event: eventId };
  if (qrToken) {
    filter.qrToken = qrToken;
  } else {
    filter._id = registrationId;
  }

  const registration = await Registration.findOne(filter)
    .populate('user', 'name email avatar phone')
    .populate('ticketType', 'name price');

  if (!registration) {
    throw ApiError.notFound('Registration pass not found for this event');
  }

  // Idempotency: if already checked in, return status clearly
  if (registration.status === REGISTRATION_STATUS.CHECKED_IN) {
    return {
      alreadyCheckedIn: true,
      message: 'Attendee has already been checked into this event',
      registration,
      checkedInAt: registration.checkedInAt,
    };
  }

  if (registration.status !== REGISTRATION_STATUS.APPROVED) {
    throw ApiError.badRequest(
      `Cannot check in attendee: registration status is '${registration.status}'`
    );
  }

  registration.status = REGISTRATION_STATUS.CHECKED_IN;
  registration.checkedInAt = new Date();
  registration.checkedInBy = staffUser._id;
  await registration.save();

  await AuditLog.create({
    user: staffUser._id,
    action: 'ATTENDEE_CHECKED_IN_EVENT',
    resource: 'Registration',
    resourceId: registration._id.toString(),
    details: { eventId, attendeeId: registration.user._id },
  });

  return {
    alreadyCheckedIn: false,
    message: 'Event check-in verified successfully',
    registration,
    checkedInAt: registration.checkedInAt,
  };
};

/**
 * Idempotent session attendance check-in.
 */
const checkinToSession = async (eventId, { qrToken, registrationId, sessionId }, staffUser) => {
  const session = await Session.findOne({ _id: sessionId, event: eventId });
  if (!session) {
    throw ApiError.notFound('Session not found for this event');
  }

  const regFilter = { event: eventId };
  if (qrToken) {
    regFilter.qrToken = qrToken;
  } else {
    regFilter._id = registrationId;
  }

  const registration = await Registration.findOne(regFilter).populate('user', 'name email');
  if (!registration) {
    throw ApiError.notFound('Registration pass not found for this event');
  }

  // Verify attendance record
  const existingAttendance = await SessionAttendance.findOne({
    session: sessionId,
    user: registration.user._id,
  });

  if (existingAttendance) {
    return {
      alreadyAttended: true,
      message: 'Attendee already marked present for this session',
      attendance: existingAttendance,
      attendee: registration.user,
      session: { id: session._id, title: session.title },
    };
  }

  const attendance = await SessionAttendance.create({
    session: sessionId,
    user: registration.user._id,
    event: eventId,
    scannedBy: staffUser._id,
    scannedAt: new Date(),
  });

  await AuditLog.create({
    user: staffUser._id,
    action: 'ATTENDEE_CHECKED_IN_SESSION',
    resource: 'SessionAttendance',
    resourceId: attendance._id.toString(),
    details: { eventId, sessionId, attendeeId: registration.user._id },
  });

  return {
    alreadyAttended: false,
    message: 'Session attendance recorded successfully',
    attendance,
    attendee: registration.user,
    session: { id: session._id, title: session.title },
  };
};

/**
 * Live attendance counters for dashboard monitoring.
 */
const getLiveAttendanceCounters = async (eventId) => {
  const [approvedCount, checkedInCount, totalWaitlisted] = await Promise.all([
    Registration.countDocuments({
      event: eventId,
      status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN] },
    }),
    Registration.countDocuments({
      event: eventId,
      status: REGISTRATION_STATUS.CHECKED_IN,
    }),
    Registration.countDocuments({
      event: eventId,
      status: REGISTRATION_STATUS.WAITLISTED,
    }),
  ]);

  const checkInRate = approvedCount > 0 ? Math.round((checkedInCount / approvedCount) * 100) : 0;

  // Session-level stats
  const sessions = await Session.find({ event: eventId }).select('title room capacity start end');
  const sessionStats = [];

  for (const s of sessions) {
    const attendees = await SessionAttendance.countDocuments({ session: s._id });
    const utilizationRate = s.capacity > 0 ? Math.round((attendees / s.capacity) * 100) : 0;
    sessionStats.push({
      sessionId: s._id,
      title: s.title,
      room: s.room,
      capacity: s.capacity,
      attendees,
      utilizationRate,
      start: s.start,
      end: s.end,
    });
  }

  return {
    eventCounters: {
      totalEligibleRegistrations: approvedCount,
      actualCheckedIn: checkedInCount,
      checkInRatePercentage: checkInRate,
      waitlistCount: totalWaitlisted,
    },
    sessions: sessionStats,
  };
};

module.exports = {
  checkinToEvent,
  checkinToSession,
  getLiveAttendanceCounters,
};
