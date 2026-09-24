const EventMember = require('../../models/EventMember');
const Event = require('../../models/Event');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { EVENT_ROLES, EVENT_MEMBER_STATUS } = require('../../config/roles');

const getEventTeam = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const team = await EventMember.find({ event: eventId })
    .populate('user', 'name email avatar phone')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

  return team;
};

const assignTeamMember = async (eventId, { userId, email, role }, actorId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  let targetUserId = userId;
  if (!targetUserId && email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.notFound(`User with email '${email}' not found. They must register first.`);
    }
    targetUserId = user._id;
  }

  const existingMember = await EventMember.findOne({
    user: targetUserId,
    event: eventId,
  });

  if (existingMember) {
    if (existingMember.status === EVENT_MEMBER_STATUS.ACTIVE) {
      throw ApiError.conflict('User is already an active member of this event team');
    }
    // Reactivate previous membership
    existingMember.role = role;
    existingMember.status = EVENT_MEMBER_STATUS.ACTIVE;
    existingMember.invitedBy = actorId;
    await existingMember.save();

    await AuditLog.create({
      user: actorId,
      action: 'EVENT_MEMBER_REACTIVATED',
      resource: 'EventMember',
      resourceId: existingMember._id.toString(),
      details: { eventId, targetUserId, role },
    });

    return existingMember;
  }

  const member = await EventMember.create({
    user: targetUserId,
    event: eventId,
    role,
    invitedBy: actorId,
    status: EVENT_MEMBER_STATUS.ACTIVE,
  });

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_MEMBER_ASSIGNED',
    resource: 'EventMember',
    resourceId: member._id.toString(),
    details: { eventId, targetUserId, role },
  });

  return member;
};

const updateTeamMember = async (eventId, memberId, { role, status }, actorId) => {
  const member = await EventMember.findOne({ _id: memberId, event: eventId });
  if (!member) {
    throw ApiError.notFound('Team member not found for this event');
  }

  // Prevent demoting the last active organizer
  if (member.role === EVENT_ROLES.ORGANIZER && role && role !== EVENT_ROLES.ORGANIZER) {
    const organizerCount = await EventMember.countDocuments({
      event: eventId,
      role: EVENT_ROLES.ORGANIZER,
      status: EVENT_MEMBER_STATUS.ACTIVE,
    });
    if (organizerCount <= 1) {
      throw ApiError.badRequest('Cannot change role: event must have at least one active organizer');
    }
  }

  if (role) member.role = role;
  if (status) member.status = status;
  await member.save();

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_MEMBER_UPDATED',
    resource: 'EventMember',
    resourceId: member._id.toString(),
    details: { role, status },
  });

  return member;
};

const removeTeamMember = async (eventId, memberId, actorId) => {
  const member = await EventMember.findOne({ _id: memberId, event: eventId });
  if (!member) {
    throw ApiError.notFound('Team member not found for this event');
  }

  if (member.role === EVENT_ROLES.ORGANIZER) {
    const organizerCount = await EventMember.countDocuments({
      event: eventId,
      role: EVENT_ROLES.ORGANIZER,
      status: EVENT_MEMBER_STATUS.ACTIVE,
    });
    if (organizerCount <= 1) {
      throw ApiError.badRequest('Cannot remove the last active organizer from the event');
    }
  }

  await EventMember.findByIdAndDelete(memberId);

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_MEMBER_REMOVED',
    resource: 'EventMember',
    resourceId: memberId,
    details: { eventId, userId: member.user },
  });

  return { message: 'Team member removed successfully' };
};

module.exports = {
  getEventTeam,
  assignTeamMember,
  updateTeamMember,
  removeTeamMember,
};
