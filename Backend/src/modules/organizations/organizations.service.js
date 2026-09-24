const Organization = require('../../models/Organization');
const Event = require('../../models/Event');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');

const createOrganization = async (data, actorId) => {
  const existingOrg = await Organization.findOne({
    $or: [{ name: data.name }, ...(data.slug ? [{ slug: data.slug }] : [])],
  });

  if (existingOrg) {
    throw ApiError.conflict('An organization with this name or slug already exists');
  }

  const org = await Organization.create(data);

  await AuditLog.create({
    user: actorId,
    action: 'ORGANIZATION_CREATED',
    resource: 'Organization',
    resourceId: org._id.toString(),
    details: data,
  });

  return org;
};

const listOrganizations = async (queryParams) => {
  const filter = {};

  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { slug: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.plan) {
    filter.plan = queryParams.plan;
  }

  if (queryParams.status) {
    filter.status = queryParams.status;
  }

  return paginateQuery(Organization, filter, queryParams);
};

const getOrganizationById = async (id) => {
  const org = await Organization.findById(id);
  if (!org) {
    throw ApiError.notFound('Organization not found');
  }

  const eventCount = await Event.countDocuments({ org: id });

  return {
    ...org.toJSON(),
    eventCount,
  };
};

const updateOrganization = async (id, updateData, actorId) => {
  const org = await Organization.findById(id);
  if (!org) {
    throw ApiError.notFound('Organization not found');
  }

  if (updateData.name !== undefined) org.name = updateData.name;
  if (updateData.plan !== undefined) org.plan = updateData.plan;
  if (updateData.settings) {
    org.settings = { ...org.settings, ...updateData.settings };
  }

  await org.save();

  await AuditLog.create({
    user: actorId,
    action: 'ORGANIZATION_UPDATED',
    resource: 'Organization',
    resourceId: org._id.toString(),
    details: updateData,
  });

  return org;
};

const updateOrganizationStatus = async (id, { status, reason }, actorId) => {
  const org = await Organization.findById(id);
  if (!org) {
    throw ApiError.notFound('Organization not found');
  }

  org.status = status;
  await org.save();

  await AuditLog.create({
    user: actorId,
    action: `ORGANIZATION_STATUS_${status.toUpperCase()}`,
    resource: 'Organization',
    resourceId: org._id.toString(),
    details: { status, reason },
  });

  return org;
};

const deleteOrganization = async (id, actorId) => {
  const org = await Organization.findById(id);
  if (!org) {
    throw ApiError.notFound('Organization not found');
  }

  // Prevent deletion if active events exist
  const activeEvents = await Event.countDocuments({
    org: id,
    status: { $in: ['published', 'live'] },
  });

  if (activeEvents > 0) {
    throw ApiError.badRequest('Cannot delete an organization with active or live events');
  }

  await Organization.findByIdAndDelete(id);

  await AuditLog.create({
    user: actorId,
    action: 'ORGANIZATION_DELETED',
    resource: 'Organization',
    resourceId: id,
  });

  return { message: 'Organization deleted successfully' };
};

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganizationById,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
};
