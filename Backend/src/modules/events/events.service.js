const Event = require('../../models/Event');
const Organization = require('../../models/Organization');
const EventMember = require('../../models/EventMember');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');
const { EVENT_ROLES, EVENT_STATUS, GLOBAL_ROLES } = require('../../config/roles');

const createEvent = async (data, actorId) => {
  const org = await Organization.findById(data.org);
  if (!org) {
    throw ApiError.notFound('Organization not found');
  }

  if (org.status !== 'active') {
    throw ApiError.badRequest('Cannot create events under an inactive or suspended organization');
  }

  // Check organization quota
  const currentEventCount = await Event.countDocuments({
    org: org._id,
    status: { $in: [EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED, EVENT_STATUS.LIVE] },
  });

  if (currentEventCount >= (org.settings?.maxEvents || 5)) {
    throw ApiError.badRequest(`Organization event limit (${org.settings?.maxEvents}) reached. Please upgrade plan.`);
  }

  const event = await Event.create({
    ...data,
    status: EVENT_STATUS.DRAFT,
    createdBy: actorId,
  });

  // Assign the creator as the event organizer
  await EventMember.create({
    user: actorId,
    event: event._id,
    role: EVENT_ROLES.ORGANIZER,
    status: 'active',
  });

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_CREATED',
    resource: 'Event',
    resourceId: event._id.toString(),
    details: { title: event.title, org: org._id },
  });

  return event;
};

const listEvents = async (queryParams = {}, user = null) => {
  const filter = {};

  if (queryParams.search) {
    filter.$or = [
      { title: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } },
      { tags: { $in: [new RegExp(queryParams.search, 'i')] } },
    ];
  }

  if (queryParams.category) {
    filter.category = queryParams.category;
  }

  if (queryParams.org) {
    filter.org = queryParams.org;
  }

  // Handle "myEvents" filter: events where the authenticated user is an active member
  if (queryParams.myEvents && user) {
    const userMemberships = await EventMember.find({
      user: user._id,
      status: 'active',
    }).select('event');
    const eventIds = userMemberships.map((m) => m.event);
    filter._id = { $in: eventIds };
  } else if (!user || user.globalRole !== GLOBAL_ROLES.PLATFORM_ADMIN) {
    // Non-platform admin public listing shows only published / live / completed events
    if (queryParams.status) {
      filter.status = queryParams.status;
    } else {
      filter.status = { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.LIVE, EVENT_STATUS.COMPLETED] };
    }
  } else if (queryParams.status) {
    filter.status = queryParams.status;
  }

  return paginateQuery(Event, filter, queryParams, {
    populate: [
      { path: 'org', select: 'name slug plan' },
      { path: 'venue', select: 'name address' },
    ],
  });
};

const getEventById = async (id, user = null) => {
  const event = await Event.findById(id)
    .populate('org', 'name slug plan status settings')
    .populate('venue')
    .populate('createdBy', 'name email');

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Public can view published, live, and completed events
  const isPubliclyAccessible = [
    EVENT_STATUS.PUBLISHED,
    EVENT_STATUS.LIVE,
    EVENT_STATUS.COMPLETED,
  ].includes(event.status);

  if (!isPubliclyAccessible) {
    if (!user) {
      throw ApiError.notFound('Event not found');
    }

    if (user.globalRole !== GLOBAL_ROLES.PLATFORM_ADMIN) {
      const membership = await EventMember.findOne({
        user: user._id,
        event: event._id,
        status: 'active',
      });

      if (!membership) {
        throw ApiError.forbidden('Access denied to unpublished event');
      }
    }
  }

  return event;
};

const updateEvent = async (id, updateData, actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Prevent modifying completed or cancelled events
  if ([EVENT_STATUS.COMPLETED, EVENT_STATUS.CANCELLED].includes(event.status)) {
    throw ApiError.badRequest(`Cannot modify an event that is ${event.status}`);
  }

  Object.assign(event, updateData);
  await event.save();

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_UPDATED',
    resource: 'Event',
    resourceId: event._id.toString(),
    details: updateData,
  });

  return event;
};

const deleteEvent = async (id, actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.status === EVENT_STATUS.LIVE) {
    throw ApiError.badRequest('Cannot delete an event that is currently live. Cancel it first.');
  }

  await Event.findByIdAndDelete(id);
  await EventMember.deleteMany({ event: id });

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_DELETED',
    resource: 'Event',
    resourceId: id,
    details: { title: event.title },
  });

  return { message: 'Event deleted successfully' };
};

const publishEvent = async (id, actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.status === EVENT_STATUS.PUBLISHED) {
    throw ApiError.badRequest('Event is already published');
  }

  if (event.endDate < new Date()) {
    throw ApiError.badRequest('Cannot publish an event with an end date in the past');
  }

  event.status = EVENT_STATUS.PUBLISHED;
  await event.save();

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_PUBLISHED',
    resource: 'Event',
    resourceId: event._id.toString(),
  });

  return event;
};

const cancelEvent = async (id, reason = '', actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.status === EVENT_STATUS.CANCELLED) {
    throw ApiError.badRequest('Event is already cancelled');
  }

  event.status = EVENT_STATUS.CANCELLED;
  await event.save();

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_CANCELLED',
    resource: 'Event',
    resourceId: event._id.toString(),
    details: { reason },
  });

  return event;
};

const duplicateEvent = async (id, duplicateData, actorId) => {
  const original = await Event.findById(id);
  if (!original) {
    throw ApiError.notFound('Source event to duplicate not found');
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newSlug = duplicateData.slug || `${duplicateData.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')}-${randomSuffix}`;

  const clonedEvent = await Event.create({
    org: original.org,
    title: duplicateData.title,
    slug: newSlug,
    description: original.description,
    category: original.category,
    tags: original.tags,
    startDate: duplicateData.startDate,
    endDate: duplicateData.endDate,
    timezone: original.timezone,
    venue: original.venue,
    status: EVENT_STATUS.DRAFT,
    banner: original.banner,
    capacity: original.capacity,
    policies: original.policies,
    createdBy: actorId,
  });

  // Assign the actor as organizer of the duplicate event
  await EventMember.create({
    user: actorId,
    event: clonedEvent._id,
    role: EVENT_ROLES.ORGANIZER,
    status: 'active',
  });

  await AuditLog.create({
    user: actorId,
    action: 'EVENT_DUPLICATED',
    resource: 'Event',
    resourceId: clonedEvent._id.toString(),
    details: { originalEventId: id, newTitle: clonedEvent.title },
  });

  return clonedEvent;
};

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  duplicateEvent,
};
