const sponsorsService = require('./sponsors.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

// Packages
const createPackage = asyncHandler(async (req, res) => {
  const pkg = await sponsorsService.createPackage(req.params.eventId, req.body, req.user._id);
  sendSuccess(res, { statusCode: 201, data: pkg });
});

const listPackages = asyncHandler(async (req, res) => {
  const packages = await sponsorsService.listPackages(req.params.eventId);
  sendSuccess(res, { statusCode: 200, data: packages });
});

const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await sponsorsService.updatePackage(
    req.params.eventId,
    req.params.id,
    req.body,
    req.user._id
  );
  sendSuccess(res, { statusCode: 200, data: pkg });
});

const deletePackage = asyncHandler(async (req, res) => {
  const result = await sponsorsService.deletePackage(req.params.eventId, req.params.id, req.user._id);
  sendSuccess(res, { statusCode: 200, data: result });
});

// Sponsorships
const createSponsorship = asyncHandler(async (req, res) => {
  const sponsorship = await sponsorsService.createSponsorship(
    req.params.eventId,
    req.body,
    req.user._id
  );
  sendSuccess(res, { statusCode: 201, data: sponsorship });
});

const listSponsorships = asyncHandler(async (req, res) => {
  const sponsorships = await sponsorsService.listSponsorships(
    req.params.eventId,
    req.user,
    req.eventMember?.role
  );
  sendSuccess(res, { statusCode: 200, data: sponsorships });
});

const getSponsorshipById = asyncHandler(async (req, res) => {
  const sponsorship = await sponsorsService.getSponsorshipById(
    req.params.eventId,
    req.params.id,
    req.user,
    req.eventMember?.role
  );
  sendSuccess(res, { statusCode: 200, data: sponsorship });
});

// Deliverables
const createDeliverable = asyncHandler(async (req, res) => {
  const deliverable = await sponsorsService.createDeliverable(
    req.params.eventId,
    req.params.sponsorshipId,
    req.body,
    req.user._id
  );
  sendSuccess(res, { statusCode: 201, data: deliverable });
});

const listDeliverables = asyncHandler(async (req, res) => {
  const deliverables = await sponsorsService.listDeliverables(
    req.params.eventId,
    req.params.sponsorshipId,
    req.user,
    req.eventMember?.role
  );
  sendSuccess(res, { statusCode: 200, data: deliverables });
});

const submitDeliverable = asyncHandler(async (req, res) => {
  const deliverable = await sponsorsService.submitDeliverable(
    req.params.eventId,
    req.params.sponsorshipId,
    req.params.id,
    req.body.asset,
    req.user
  );
  sendSuccess(res, { statusCode: 200, data: deliverable });
});

const reviewDeliverable = asyncHandler(async (req, res) => {
  const deliverable = await sponsorsService.reviewDeliverable(
    req.params.eventId,
    req.params.sponsorshipId,
    req.params.id,
    req.body,
    req.user._id
  );
  sendSuccess(res, { statusCode: 200, data: deliverable });
});

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
