const Speaker = require('../../models/Speaker');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');

const createSpeaker = async (data, actorId) => {
  const speaker = await Speaker.create(data);

  await AuditLog.create({
    user: actorId,
    action: 'SPEAKER_CREATED',
    resource: 'Speaker',
    resourceId: speaker._id.toString(),
    details: { name: speaker.name },
  });

  return speaker;
};

const listSpeakers = async (queryParams) => {
  const filter = {};

  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { company: { $regex: queryParams.search, $options: 'i' } },
      { bio: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.expertise) {
    filter.expertise = { $in: [new RegExp(queryParams.expertise, 'i')] };
  }

  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive;
  }

  return paginateQuery(Speaker, filter, queryParams, {
    populate: { path: 'user', select: 'name email avatar' },
  });
};

const getSpeakerById = async (id) => {
  const speaker = await Speaker.findById(id).populate('user', 'name email avatar');
  if (!speaker) {
    throw ApiError.notFound('Speaker not found');
  }
  return speaker;
};

const updateSpeaker = async (id, updateData, actorId) => {
  const speaker = await Speaker.findById(id);
  if (!speaker) {
    throw ApiError.notFound('Speaker not found');
  }

  Object.assign(speaker, updateData);
  await speaker.save();

  await AuditLog.create({
    user: actorId,
    action: 'SPEAKER_UPDATED',
    resource: 'Speaker',
    resourceId: speaker._id.toString(),
    details: updateData,
  });

  return speaker;
};

const deleteSpeaker = async (id, actorId) => {
  const speaker = await Speaker.findById(id);
  if (!speaker) {
    throw ApiError.notFound('Speaker not found');
  }

  await Speaker.findByIdAndDelete(id);

  await AuditLog.create({
    user: actorId,
    action: 'SPEAKER_DELETED',
    resource: 'Speaker',
    resourceId: id,
  });

  return { message: 'Speaker deleted successfully' };
};

module.exports = {
  createSpeaker,
  listSpeakers,
  getSpeakerById,
  updateSpeaker,
  deleteSpeaker,
};
