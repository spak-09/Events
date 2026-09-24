const Venue = require('../../models/Venue');
const Event = require('../../models/Event');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');

const createVenue = async (data, actorId) => {
  const venue = await Venue.create(data);

  await AuditLog.create({
    user: actorId,
    action: 'VENUE_CREATED',
    resource: 'Venue',
    resourceId: venue._id.toString(),
    details: { name: venue.name },
  });

  return venue;
};

const listVenues = async (queryParams) => {
  const filter = {};

  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { 'address.city': { $regex: queryParams.search, $options: 'i' } },
      { 'address.country': { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.city) {
    filter['address.city'] = { $regex: queryParams.city, $options: 'i' };
  }

  if (queryParams.country) {
    filter['address.country'] = { $regex: queryParams.country, $options: 'i' };
  }

  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive;
  }

  return paginateQuery(Venue, filter, queryParams);
};

const getVenueById = async (id) => {
  const venue = await Venue.findById(id);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }
  return venue;
};

const updateVenue = async (id, updateData, actorId) => {
  const venue = await Venue.findById(id);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  Object.assign(venue, updateData);
  await venue.save();

  await AuditLog.create({
    user: actorId,
    action: 'VENUE_UPDATED',
    resource: 'Venue',
    resourceId: venue._id.toString(),
    details: updateData,
  });

  return venue;
};

const deleteVenue = async (id, actorId) => {
  const venue = await Venue.findById(id);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  // Check if any active event uses this venue
  const assignedEvents = await Event.countDocuments({
    venue: id,
    status: { $in: ['draft', 'published', 'live'] },
  });

  if (assignedEvents > 0) {
    throw ApiError.badRequest(`Cannot delete venue: it is assigned to ${assignedEvents} active or upcoming event(s)`);
  }

  await Venue.findByIdAndDelete(id);

  await AuditLog.create({
    user: actorId,
    action: 'VENUE_DELETED',
    resource: 'Venue',
    resourceId: id,
  });

  return { message: 'Venue deleted successfully' };
};

const addRoom = async (venueId, roomData, actorId) => {
  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  venue.rooms.push(roomData);
  await venue.save();

  const newRoom = venue.rooms[venue.rooms.length - 1];

  await AuditLog.create({
    user: actorId,
    action: 'VENUE_ROOM_ADDED',
    resource: 'Venue',
    resourceId: venue._id.toString(),
    details: { roomId: newRoom._id, roomName: roomData.name },
  });

  return newRoom;
};

const updateRoom = async (venueId, roomId, updateData, actorId) => {
  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  const room = venue.rooms.id(roomId);
  if (!room) {
    throw ApiError.notFound('Room not found in venue');
  }

  Object.assign(room, updateData);
  await venue.save();

  await AuditLog.create({
    user: actorId,
    action: 'VENUE_ROOM_UPDATED',
    resource: 'Venue',
    resourceId: venue._id.toString(),
    details: { roomId, updateData },
  });

  return room;
};

const deleteRoom = async (venueId, roomId, actorId) => {
  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  const room = venue.rooms.id(roomId);
  if (!room) {
    throw ApiError.notFound('Room not found in venue');
  }

  venue.rooms.pull({ _id: roomId });
  await venue.save();

  await AuditLog.create({
    user: actorId,
    action: 'VENUE_ROOM_DELETED',
    resource: 'Venue',
    resourceId: venue._id.toString(),
    details: { roomId },
  });

  return { message: 'Room deleted successfully' };
};

module.exports = {
  createVenue,
  listVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  addRoom,
  updateRoom,
  deleteRoom,
};
