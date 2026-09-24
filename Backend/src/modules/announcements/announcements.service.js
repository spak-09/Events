const Announcement = require('../../models/Announcement');
const Event = require('../../models/Event');
const EventMember = require('../../models/EventMember');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { GLOBAL_ROLES, EVENT_ROLES } = require('../../config/roles');

const getEventAnnouncements = async (eventId, user = null) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const filter = { event: eventId };

  // Audience segregation based on viewer context
  if (!user) {
    // Unauthenticated public sees only 'all' announcements
    filter.audience = 'all';
  } else if (user.globalRole !== GLOBAL_ROLES.PLATFORM_ADMIN) {
    const membership = await EventMember.findOne({
      user: user._id,
      event: eventId,
      status: 'active',
    });

    if (!membership) {
      filter.audience = { $in: ['all', 'attendees'] };
    } else if ([EVENT_ROLES.ORGANIZER, EVENT_ROLES.STAFF].includes(membership.role)) {
      // Organizers and staff see all broadcasts for their event
    } else if (membership.role === EVENT_ROLES.SPEAKER) {
      filter.audience = { $in: ['all', 'speakers'] };
    } else if (membership.role === EVENT_ROLES.SPONSOR) {
      filter.audience = { $in: ['all', 'sponsors'] };
    }
  }

  return Announcement.find(filter)
    .populate('sentBy', 'name email avatar')
    .sort({ isPinned: -1, sentAt: -1 });
};

const getAnnouncementById = async (eventId, id) => {
  const announcement = await Announcement.findOne({ _id: id, event: eventId }).populate(
    'sentBy',
    'name email avatar'
  );
  if (!announcement) {
    throw ApiError.notFound('Announcement not found for this event');
  }
  return announcement;
};

const createAnnouncement = async (eventId, data, actorId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const announcement = await Announcement.create({
    event: eventId,
    title: data.title,
    body: data.body,
    audience: data.audience || 'all',
    isPinned: data.isPinned || false,
    sentBy: actorId,
    sentAt: new Date(),
  });

  await AuditLog.create({
    user: actorId,
    action: 'ANNOUNCEMENT_CREATED',
    resource: 'Announcement',
    resourceId: announcement._id.toString(),
    details: { eventId, title: announcement.title, audience: announcement.audience },
  });

  return announcement;
};

const updateAnnouncement = async (eventId, id, updateData, actorId) => {
  const announcement = await Announcement.findOne({ _id: id, event: eventId });
  if (!announcement) {
    throw ApiError.notFound('Announcement not found for this event');
  }

  Object.assign(announcement, updateData);
  await announcement.save();

  await AuditLog.create({
    user: actorId,
    action: 'ANNOUNCEMENT_UPDATED',
    resource: 'Announcement',
    resourceId: announcement._id.toString(),
    details: updateData,
  });

  return announcement;
};

const deleteAnnouncement = async (eventId, id, actorId) => {
  const announcement = await Announcement.findOne({ _id: id, event: eventId });
  if (!announcement) {
    throw ApiError.notFound('Announcement not found for this event');
  }

  await Announcement.findByIdAndDelete(id);

  await AuditLog.create({
    user: actorId,
    action: 'ANNOUNCEMENT_DELETED',
    resource: 'Announcement',
    resourceId: id,
    details: { eventId },
  });

  return { message: 'Announcement deleted successfully' };
};

module.exports = {
  getEventAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
