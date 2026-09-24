const crypto = require('crypto');
const QRCode = require('qrcode');
const Registration = require('../../models/Registration');
const TicketType = require('../../models/TicketType');
const Coupon = require('../../models/Coupon');
const Event = require('../../models/Event');
const Session = require('../../models/Session');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');
const { REGISTRATION_STATUS, EVENT_STATUS, COUPON_TYPE } = require('../../config/roles');

/**
 * Generate a non-guessable, signed-like cryptographic QR token and its QR data URL.
 */
const generateQRData = async (registrationId, eventId, userId) => {
  const randomEntropy = crypto.randomBytes(24).toString('hex');
  const qrToken = `ef_${eventId.toString().slice(-6)}_${registrationId.toString().slice(-6)}_${randomEntropy}`;
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
  });
  return { qrToken, qrDataUrl };
};

/**
 * Register a user for an event with atomic capacity check and automatic waitlisting.
 */
const registerForEvent = async (eventId, userId, data) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (![EVENT_STATUS.PUBLISHED, EVENT_STATUS.LIVE].includes(event.status)) {
    throw ApiError.badRequest(`Cannot register for an event in '${event.status}' status`);
  }

  // Check if user is already actively registered
  const existingActiveReg = await Registration.findOne({
    event: eventId,
    user: userId,
    status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.PENDING, REGISTRATION_STATUS.CHECKED_IN] },
  });

  if (existingActiveReg) {
    throw ApiError.conflict('You already have an active registration for this event');
  }

  // Find target ticket type
  const ticket = await TicketType.findOne({ _id: data.ticketTypeId, event: eventId });
  if (!ticket) {
    throw ApiError.notFound('Ticket type not found');
  }

  const now = new Date();
  if (ticket.salesWindow) {
    if (ticket.salesWindow.start && now < new Date(ticket.salesWindow.start)) {
      throw ApiError.badRequest('Ticket sales have not opened yet');
    }
    if (ticket.salesWindow.end && now > new Date(ticket.salesWindow.end)) {
      throw ApiError.badRequest('Ticket sales have concluded for this tier');
    }
  }

  // Validate coupon if provided
  let couponDoc = null;
  let finalPrice = ticket.price;

  if (data.couponCode) {
    couponDoc = await Coupon.findOne({
      event: eventId,
      code: data.couponCode.toUpperCase(),
    });

    if (!couponDoc) {
      throw ApiError.badRequest('Invalid coupon code');
    }

    if (now > new Date(couponDoc.expiry)) {
      throw ApiError.badRequest('Coupon has expired');
    }

    if (couponDoc.used >= couponDoc.maxUses) {
      throw ApiError.badRequest('Coupon usage limit reached');
    }

    if (couponDoc.ticketTypes && couponDoc.ticketTypes.length > 0) {
      const applicable = couponDoc.ticketTypes.some((t) => t.toString() === data.ticketTypeId);
      if (!applicable) {
        throw ApiError.badRequest('Coupon is not valid for this ticket type');
      }
    }

    let discount = 0;
    if (couponDoc.type === COUPON_TYPE.PERCENT) {
      discount = (ticket.price * couponDoc.value) / 100;
    } else {
      discount = Math.min(ticket.price, couponDoc.value);
    }
    finalPrice = Math.max(0, ticket.price - discount);
  }

  // Check for session conflicts among attendee's selected sessions
  const warnings = [];
  if (data.selectedSessions && data.selectedSessions.length > 1) {
    const sessions = await Session.find({
      _id: { $in: data.selectedSessions },
      event: eventId,
    });

    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const s1 = sessions[i];
        const s2 = sessions[j];
        if (s1.start < s2.end && s1.end > s2.start) {
          warnings.push(
            `Session conflict detected: "${s1.title}" (${new Date(s1.start).toLocaleTimeString()} - ${new Date(s1.end).toLocaleTimeString()}) overlaps with "${s2.title}" (${new Date(s2.start).toLocaleTimeString()} - ${new Date(s2.end).toLocaleTimeString()})`
          );
        }
      }
    }
  }

  // ATOMIC CAPACITY CONTROL:
  // Use findOneAndUpdate with $expr: { $lt: ['$sold', '$capacity'] } to guard against race conditions
  const claimedTicket = await TicketType.findOneAndUpdate(
    {
      _id: data.ticketTypeId,
      event: eventId,
      $expr: { $lt: ['$sold', '$capacity'] },
    },
    { $inc: { sold: 1 } },
    { new: true }
  );

  let registrationStatus;
  let waitlistPosition = null;
  let qrToken = null;
  let qrDataUrl = null;

  if (!claimedTicket) {
    // Capacity exhausted -> place on waitlist (FIFO)
    const currentWaitlistCount = await Registration.countDocuments({
      event: eventId,
      ticketType: data.ticketTypeId,
      status: REGISTRATION_STATUS.WAITLISTED,
    });
    waitlistPosition = currentWaitlistCount + 1;
    registrationStatus = REGISTRATION_STATUS.WAITLISTED;
  } else {
    // Capacity successfully reserved
    if (claimedTicket.requiresApproval) {
      registrationStatus = REGISTRATION_STATUS.PENDING;
    } else {
      registrationStatus = REGISTRATION_STATUS.APPROVED;
    }

    // Increment coupon usage if registration was approved
    if (couponDoc && registrationStatus === REGISTRATION_STATUS.APPROVED) {
      await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { used: 1 } });
    }
  }

  const registration = new Registration({
    event: eventId,
    user: userId,
    ticketType: data.ticketTypeId,
    coupon: couponDoc ? couponDoc._id : null,
    status: registrationStatus,
    interests: data.interests || [],
    selectedSessions: data.selectedSessions || [],
    waitlistPosition,
    finalPrice: Math.round(finalPrice * 100) / 100,
  });

  // If approved immediately, generate QR code token
  if (registrationStatus === REGISTRATION_STATUS.APPROVED) {
    const qrData = await generateQRData(registration._id, eventId, userId);
    registration.qrToken = qrData.qrToken;
    registration.qrDataUrl = qrData.qrDataUrl;
  }

  await registration.save();

  await AuditLog.create({
    user: userId,
    action: `REGISTRATION_${registrationStatus.toUpperCase()}`,
    resource: 'Registration',
    resourceId: registration._id.toString(),
    details: { eventId, ticketTypeId: data.ticketTypeId, finalPrice, waitlistPosition },
  });

  return {
    registration,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Cancel a registration and automatically promote the next waitlisted attendee in line.
 */
const cancelRegistration = async (eventId, registrationId, actorUser) => {
  const registration = await Registration.findOne({ _id: registrationId, event: eventId });
  if (!registration) {
    throw ApiError.notFound('Registration not found');
  }

  if (registration.status === REGISTRATION_STATUS.CANCELLED) {
    throw ApiError.badRequest('Registration is already cancelled');
  }

  const wasHoldingCapacity = [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.PENDING].includes(
    registration.status
  );
  const wasWaitlisted = registration.status === REGISTRATION_STATUS.WAITLISTED;
  const previousWaitlistPos = registration.waitlistPosition;

  registration.status = REGISTRATION_STATUS.CANCELLED;
  registration.waitlistPosition = null;
  await registration.save();

  let promotedRegistration = null;

  if (wasHoldingCapacity) {
    // Release capacity on ticket type
    await TicketType.findByIdAndUpdate(registration.ticketType, { $inc: { sold: -1 } });

    // FIFO Auto-promotion: find next in line on waitlist for this ticket tier
    const nextInLine = await Registration.findOne({
      event: eventId,
      ticketType: registration.ticketType,
      status: REGISTRATION_STATUS.WAITLISTED,
    }).sort({ waitlistPosition: 1 });

    if (nextInLine) {
      const ticket = await TicketType.findById(registration.ticketType);

      // Claim capacity for promoted user
      await TicketType.findByIdAndUpdate(registration.ticketType, { $inc: { sold: 1 } });

      const oldPos = nextInLine.waitlistPosition;
      nextInLine.status = ticket?.requiresApproval
        ? REGISTRATION_STATUS.PENDING
        : REGISTRATION_STATUS.APPROVED;
      nextInLine.waitlistPosition = null;

      if (nextInLine.status === REGISTRATION_STATUS.APPROVED && !nextInLine.qrToken) {
        const qrData = await generateQRData(nextInLine._id, eventId, nextInLine.user);
        nextInLine.qrToken = qrData.qrToken;
        nextInLine.qrDataUrl = qrData.qrDataUrl;
      }

      await nextInLine.save();
      promotedRegistration = nextInLine;

      // Adjust remaining waitlist positions
      await Registration.updateMany(
        {
          event: eventId,
          ticketType: registration.ticketType,
          status: REGISTRATION_STATUS.WAITLISTED,
          waitlistPosition: { $gt: oldPos },
        },
        { $inc: { waitlistPosition: -1 } }
      );

      await AuditLog.create({
        user: actorUser._id,
        action: 'WAITLIST_AUTO_PROMOTED',
        resource: 'Registration',
        resourceId: nextInLine._id.toString(),
        details: { eventId, promotedTo: nextInLine.status },
      });
    }
  } else if (wasWaitlisted && previousWaitlistPos) {
    // Adjust waitlist positions behind the cancelled attendee
    await Registration.updateMany(
      {
        event: eventId,
        ticketType: registration.ticketType,
        status: REGISTRATION_STATUS.WAITLISTED,
        waitlistPosition: { $gt: previousWaitlistPos },
      },
      { $inc: { waitlistPosition: -1 } }
    );
  }

  await AuditLog.create({
    user: actorUser._id,
    action: 'REGISTRATION_CANCELLED',
    resource: 'Registration',
    resourceId: registrationId,
    details: { eventId },
  });

  return {
    registration,
    promotedRegistration,
  };
};

/**
 * Organizer review of approval-required registrations.
 */
const updateRegistrationStatus = async (eventId, registrationId, status, actorId) => {
  const registration = await Registration.findOne({ _id: registrationId, event: eventId });
  if (!registration) {
    throw ApiError.notFound('Registration not found');
  }

  if (registration.status !== REGISTRATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot review registration with status '${registration.status}'`);
  }

  if (status === 'approved') {
    registration.status = REGISTRATION_STATUS.APPROVED;
    if (!registration.qrToken) {
      const qrData = await generateQRData(registration._id, eventId, registration.user);
      registration.qrToken = qrData.qrToken;
      registration.qrDataUrl = qrData.qrDataUrl;
    }
  } else {
    registration.status = REGISTRATION_STATUS.REJECTED;
    // Free up ticket capacity
    await TicketType.findByIdAndUpdate(registration.ticketType, { $inc: { sold: -1 } });
  }

  await registration.save();

  await AuditLog.create({
    user: actorId,
    action: `REGISTRATION_${status.toUpperCase()}`,
    resource: 'Registration',
    resourceId: registrationId,
    details: { eventId, status },
  });

  return registration;
};

/**
 * Attendee session picking with conflict warnings.
 */
const pickSessions = async (eventId, userId, sessionIds) => {
  const registration = await Registration.findOne({
    event: eventId,
    user: userId,
    status: { $in: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.CHECKED_IN] },
  });

  if (!registration) {
    throw ApiError.notFound('Active approved registration required to select sessions');
  }

  const sessions = await Session.find({
    _id: { $in: sessionIds },
    event: eventId,
  });

  if (sessions.length !== sessionIds.length) {
    throw ApiError.badRequest('One or more selected session IDs are invalid for this event');
  }

  const warnings = [];
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i];
      const s2 = sessions[j];
      if (s1.start < s2.end && s1.end > s2.start) {
        warnings.push(`Schedule overlap: "${s1.title}" overlaps with "${s2.title}"`);
      }
    }
  }

  registration.selectedSessions = sessionIds;
  await registration.save();

  return {
    registration,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Get attendee's personal registrations across events.
 */
const getMyRegistrations = async (userId) => {
  return Registration.find({ user: userId })
    .populate('event', 'title slug status startDate endDate venue banner')
    .populate('ticketType', 'name price')
    .populate('selectedSessions', 'title room start end track')
    .sort({ createdAt: -1 });
};

/**
 * List registrations for an event (Organizer/Staff).
 */
const listRegistrations = async (eventId, queryParams) => {
  const filter = { event: eventId };

  if (queryParams.status) {
    filter.status = queryParams.status;
  }

  if (queryParams.ticketType) {
    filter.ticketType = queryParams.ticketType;
  }

  return paginateQuery(Registration, filter, queryParams, {
    populate: [
      { path: 'user', select: 'name email avatar phone' },
      { path: 'ticketType', select: 'name price' },
      { path: 'coupon', select: 'code type value' },
    ],
  });
};

const getRegistrationById = async (eventId, id) => {
  const registration = await Registration.findOne({ _id: id, event: eventId })
    .populate('user', 'name email avatar phone')
    .populate('ticketType')
    .populate('selectedSessions')
    .populate('event', 'title slug startDate endDate venue');

  if (!registration) {
    throw ApiError.notFound('Registration not found');
  }

  return registration;
};

module.exports = {
  generateQRData,
  registerForEvent,
  cancelRegistration,
  updateRegistrationStatus,
  pickSessions,
  getMyRegistrations,
  listRegistrations,
  getRegistrationById,
};
