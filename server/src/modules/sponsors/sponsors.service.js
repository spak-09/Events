const SponsorPackage = require('../../models/SponsorPackage');
const Sponsorship = require('../../models/Sponsorship');
const Deliverable = require('../../models/Deliverable');
const EventMember = require('../../models/EventMember');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { GLOBAL_ROLES, EVENT_ROLES, DELIVERABLE_STATUS } = require('../../config/roles');

/**
 * Packages Management
 */
const createPackage = async (eventId, data, actorId) => {
  const pkg = await SponsorPackage.create({
    ...data,
    event: eventId,
    claimed: 0,
  });

  await AuditLog.create({
    user: actorId,
    action: 'SPONSOR_PACKAGE_CREATED',
    resource: 'SponsorPackage',
    resourceId: pkg._id.toString(),
    details: { eventId, name: pkg.name, tier: pkg.tier, slots: pkg.slots },
  });

  return pkg;
};

const listPackages = async (eventId) => {
  return SponsorPackage.find({ event: eventId }).sort({ price: -1 });
};

const updatePackage = async (eventId, id, updateData, actorId) => {
  const pkg = await SponsorPackage.findOne({ _id: id, event: eventId });
  if (!pkg) {
    throw ApiError.notFound('Sponsor package not found');
  }

  Object.assign(pkg, updateData);
  await pkg.save();

  await AuditLog.create({
    user: actorId,
    action: 'SPONSOR_PACKAGE_UPDATED',
    resource: 'SponsorPackage',
    resourceId: id,
    details: updateData,
  });

  return pkg;
};

const deletePackage = async (eventId, id, actorId) => {
  const pkg = await SponsorPackage.findOne({ _id: id, event: eventId });
  if (!pkg) {
    throw ApiError.notFound('Sponsor package not found');
  }

  if (pkg.claimed > 0) {
    throw ApiError.badRequest(`Cannot delete package with ${pkg.claimed} active sponsorship(s)`);
  }

  await SponsorPackage.findByIdAndDelete(id);

  await AuditLog.create({
    user: actorId,
    action: 'SPONSOR_PACKAGE_DELETED',
    resource: 'SponsorPackage',
    resourceId: id,
  });

  return { message: 'Package deleted successfully' };
};

/**
 * Sponsorship Management
 */
const createSponsorship = async (eventId, data, actorId) => {
  const pkg = await SponsorPackage.findOne({ _id: data.packageId, event: eventId });
  if (!pkg) {
    throw ApiError.notFound('Sponsor package not found for this event');
  }

  if (pkg.claimed >= pkg.slots) {
    throw ApiError.badRequest('All available slots for this sponsorship package have been claimed');
  }

  const sponsorship = await Sponsorship.create({
    event: eventId,
    sponsor: data.sponsorId,
    companyName: data.companyName,
    companyLogo: data.companyLogo || null,
    package: data.packageId,
    status: data.status || 'confirmed',
  });

  // Increment claimed counter on package
  await SponsorPackage.findByIdAndUpdate(pkg._id, { $inc: { claimed: 1 } });

  // Ensure user is assigned as 'sponsor' role in EventMember
  await EventMember.findOneAndUpdate(
    { user: data.sponsorId, event: eventId },
    {
      user: data.sponsorId,
      event: eventId,
      role: EVENT_ROLES.SPONSOR,
      status: 'active',
      invitedBy: actorId,
    },
    { upsert: true, new: true }
  );

  await AuditLog.create({
    user: actorId,
    action: 'SPONSORSHIP_ALLOCATED',
    resource: 'Sponsorship',
    resourceId: sponsorship._id.toString(),
    details: { eventId, companyName: sponsorship.companyName, tier: pkg.tier },
  });

  return sponsorship;
};

const listSponsorships = async (eventId, user, memberRole) => {
  const isPrivileged =
    user.globalRole === GLOBAL_ROLES.PLATFORM_ADMIN || memberRole === EVENT_ROLES.ORGANIZER;

  const filter = { event: eventId };
  if (!isPrivileged) {
    // Non-organizers only see their own sponsorships
    filter.sponsor = user._id;
  }

  return Sponsorship.find(filter)
    .populate('sponsor', 'name email avatar')
    .populate('package', 'name tier price benefits')
    .sort({ createdAt: -1 });
};

const getSponsorshipById = async (eventId, id, user, memberRole) => {
  const sponsorship = await Sponsorship.findOne({ _id: id, event: eventId })
    .populate('sponsor', 'name email avatar')
    .populate('package');

  if (!sponsorship) {
    throw ApiError.notFound('Sponsorship not found');
  }

  const isPrivileged =
    user.globalRole === GLOBAL_ROLES.PLATFORM_ADMIN || memberRole === EVENT_ROLES.ORGANIZER;

  if (!isPrivileged && sponsorship.sponsor._id.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You can only view your own sponsorship records');
  }

  return sponsorship;
};

/**
 * Deliverables Tracking
 */
const createDeliverable = async (eventId, sponsorshipId, data, actorId) => {
  const sponsorship = await Sponsorship.findOne({ _id: sponsorshipId, event: eventId });
  if (!sponsorship) {
    throw ApiError.notFound('Sponsorship not found');
  }

  const deliverable = await Deliverable.create({
    ...data,
    sponsorship: sponsorshipId,
    event: eventId,
  });

  await AuditLog.create({
    user: actorId,
    action: 'DELIVERABLE_CREATED',
    resource: 'Deliverable',
    resourceId: deliverable._id.toString(),
    details: { eventId, sponsorshipId, title: deliverable.title },
  });

  return deliverable;
};

const listDeliverables = async (eventId, sponsorshipId, user, memberRole) => {
  const sponsorship = await Sponsorship.findOne({ _id: sponsorshipId, event: eventId });
  if (!sponsorship) {
    throw ApiError.notFound('Sponsorship not found');
  }

  const isPrivileged =
    user.globalRole === GLOBAL_ROLES.PLATFORM_ADMIN || memberRole === EVENT_ROLES.ORGANIZER;

  if (!isPrivileged && sponsorship.sponsor.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You can only view deliverables for your own sponsorship');
  }

  return Deliverable.find({ sponsorship: sponsorshipId }).sort({ dueDate: 1 });
};

const submitDeliverable = async (eventId, sponsorshipId, deliverableId, asset, user) => {
  const sponsorship = await Sponsorship.findOne({ _id: sponsorshipId, event: eventId });
  if (!sponsorship) {
    throw ApiError.notFound('Sponsorship not found');
  }

  if (sponsorship.sponsor.toString() !== user._id.toString()) {
    throw ApiError.forbidden('You can only submit deliverables for your own company sponsorship');
  }

  const deliverable = await Deliverable.findOne({ _id: deliverableId, sponsorship: sponsorshipId });
  if (!deliverable) {
    throw ApiError.notFound('Deliverable not found');
  }

  deliverable.asset = asset;
  deliverable.status = DELIVERABLE_STATUS.SUBMITTED;
  deliverable.submittedAt = new Date();
  await deliverable.save();

  await AuditLog.create({
    user: user._id,
    action: 'DELIVERABLE_SUBMITTED',
    resource: 'Deliverable',
    resourceId: deliverableId,
    details: { eventId, asset },
  });

  return deliverable;
};

const reviewDeliverable = async (eventId, sponsorshipId, deliverableId, { status, reviewNotes }, actorId) => {
  const deliverable = await Deliverable.findOne({ _id: deliverableId, sponsorship: sponsorshipId, event: eventId });
  if (!deliverable) {
    throw ApiError.notFound('Deliverable not found');
  }

  deliverable.status = status;
  deliverable.reviewNotes = reviewNotes || '';
  deliverable.reviewedAt = new Date();
  await deliverable.save();

  await AuditLog.create({
    user: actorId,
    action: `DELIVERABLE_${status.toUpperCase()}`,
    resource: 'Deliverable',
    resourceId: deliverableId,
    details: { eventId, status, reviewNotes },
  });

  return deliverable;
};

module.exports = {
  createPackage,
  listPackages,
  updatePackage,
  deletePackage,
  createSponsorship,
  listSponsorships,
  getSponsorshipById,
  createDeliverable,
  listDeliverables,
  submitDeliverable,
  reviewDeliverable,
};
