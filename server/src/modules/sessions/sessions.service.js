const Session = require('../../models/Session');
const Event = require('../../models/Event');
const Venue = require('../../models/Venue');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');

/**
 * Validates scheduling rules against room overlap, speaker availability,
 * event date boundaries, and venue room capacity.
 */
const checkSchedulingConflicts = async (eventId, {
  room,
  start,
  end,
  speakers = [],
  capacity,
  excludeSessionId = null,
}) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const conflicts = [];
  const sessionStart = new Date(start);
  const sessionEnd = new Date(end);

  // 1. Boundary Check: Session outside event dates
  if (sessionStart < new Date(event.startDate) || sessionEnd > new Date(event.endDate)) {
    conflicts.push({
      type: 'OUTSIDE_EVENT_DATES',
      message: `Session schedule (${sessionStart.toISOString()} - ${sessionEnd.toISOString()}) falls outside event dates (${new Date(event.startDate).toISOString()} - ${new Date(event.endDate).toISOString()})`,
    });
  }

  // 2. Capacity Check: Room capacity < session capacity
  if (capacity && event.venue) {
    const venue = await Venue.findById(event.venue);
    if (venue && venue.rooms) {
      const targetRoom = venue.rooms.find(
        (r) => r.name.toLowerCase() === room.toLowerCase() || r._id.toString() === room
      );
      if (targetRoom && targetRoom.capacity < capacity) {
        conflicts.push({
          type: 'ROOM_CAPACITY_EXCEEDED',
          message: `Session capacity (${capacity}) exceeds room '${targetRoom.name}' maximum capacity (${targetRoom.capacity})`,
          roomCapacity: targetRoom.capacity,
          sessionCapacity: capacity,
        });
      }
    }
  }

  // 3. Room Overlap Check: start < otherEnd && end > otherStart in the same room
  const roomFilter = {
    event: eventId,
    room: new RegExp(`^${room.trim()}$`, 'i'),
    start: { $lt: sessionEnd },
    end: { $gt: sessionStart },
  };
  if (excludeSessionId) {
    roomFilter._id = { $ne: excludeSessionId };
  }

  const roomConflicts = await Session.find(roomFilter).populate('speakers', 'name');
  if (roomConflicts.length > 0) {
    const firstConflict = roomConflicts[0];
    conflicts.push({
      type: 'ROOM_OVERLAP',
      message: `Room '${room}' is already occupied by session '${firstConflict.title}' from ${new Date(firstConflict.start).toLocaleTimeString()} to ${new Date(firstConflict.end).toLocaleTimeString()}`,
      conflictingSession: {
        id: firstConflict._id,
        title: firstConflict.title,
        start: firstConflict.start,
        end: firstConflict.end,
      },
    });
  }

  // 4. Speaker Double-Booking Check: any speaker booked during this window
  if (speakers && speakers.length > 0) {
    const speakerFilter = {
      event: eventId,
      speakers: { $in: speakers },
      start: { $lt: sessionEnd },
      end: { $gt: sessionStart },
    };
    if (excludeSessionId) {
      speakerFilter._id = { $ne: excludeSessionId };
    }

    const speakerConflicts = await Session.find(speakerFilter).populate('speakers', 'name');
    if (speakerConflicts.length > 0) {
      const firstConflict = speakerConflicts[0];
      const bookedSpeakers = firstConflict.speakers
        .filter((s) => speakers.includes(s._id.toString()))
        .map((s) => s.name);

      conflicts.push({
        type: 'SPEAKER_DOUBLE_BOOKING',
        message: `Speaker(s) [${bookedSpeakers.join(', ')}] already booked for session '${firstConflict.title}' from ${new Date(firstConflict.start).toLocaleTimeString()} to ${new Date(firstConflict.end).toLocaleTimeString()}`,
        conflictingSession: {
          id: firstConflict._id,
          title: firstConflict.title,
          start: firstConflict.start,
          end: firstConflict.end,
        },
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
};

const createSession = async (eventId, data, actorId) => {
  const conflictReport = await checkSchedulingConflicts(eventId, data);
  if (conflictReport.hasConflict) {
    const primaryConflict = conflictReport.conflicts[0];
    throw ApiError.scheduleConflict(primaryConflict.message, conflictReport.conflicts);
  }

  const session = await Session.create({
    ...data,
    event: eventId,
  });

  await AuditLog.create({
    user: actorId,
    action: 'SESSION_CREATED',
    resource: 'Session',
    resourceId: session._id.toString(),
    details: { eventId, title: session.title, room: session.room, start: session.start, end: session.end },
  });

  return session;
};

const updateSession = async (eventId, sessionId, updateData, actorId) => {
  const session = await Session.findOne({ _id: sessionId, event: eventId });
  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  const merged = {
    room: updateData.room || session.room,
    start: updateData.start || session.start,
    end: updateData.end || session.end,
    speakers: updateData.speakers !== undefined ? updateData.speakers : session.speakers.map((s) => s.toString()),
    capacity: updateData.capacity || session.capacity,
    excludeSessionId: sessionId,
  };

  const conflictReport = await checkSchedulingConflicts(eventId, merged);
  if (conflictReport.hasConflict) {
    const primaryConflict = conflictReport.conflicts[0];
    throw ApiError.scheduleConflict(primaryConflict.message, conflictReport.conflicts);
  }

  Object.assign(session, updateData);
  await session.save();

  await AuditLog.create({
    user: actorId,
    action: 'SESSION_UPDATED',
    resource: 'Session',
    resourceId: sessionId,
    details: updateData,
  });

  return session;
};

const deleteSession = async (eventId, sessionId, actorId) => {
  const session = await Session.findOne({ _id: sessionId, event: eventId });
  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  await Session.findByIdAndDelete(sessionId);

  await AuditLog.create({
    user: actorId,
    action: 'SESSION_DELETED',
    resource: 'Session',
    resourceId: sessionId,
    details: { eventId, title: session.title },
  });

  return { message: 'Session deleted successfully' };
};

const listSessions = async (eventId, queryParams) => {
  const filter = { event: eventId };

  if (queryParams.room) {
    filter.room = new RegExp(queryParams.room, 'i');
  }

  if (queryParams.track) {
    filter.track = queryParams.track;
  }

  if (queryParams.speaker) {
    filter.speakers = queryParams.speaker;
  }

  if (queryParams.status) {
    filter.status = queryParams.status;
  }

  if (queryParams.search) {
    filter.$or = [
      { title: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } },
      { tags: { $in: [new RegExp(queryParams.search, 'i')] } },
    ];
  }

  return paginateQuery(Session, filter, queryParams, {
    populate: { path: 'speakers', select: 'name title company photo' },
  });
};

const getSessionById = async (eventId, sessionId) => {
  const session = await Session.findOne({ _id: sessionId, event: eventId }).populate(
    'speakers',
    'name bio title company photo expertise'
  );
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  return session;
};

module.exports = {
  checkSchedulingConflicts,
  createSession,
  updateSession,
  deleteSession,
  listSessions,
  getSessionById,
};
