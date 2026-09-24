const organizationsService = require('./organizations.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createOrganization = asyncHandler(async (req, res) => {
  const org = await organizationsService.createOrganization(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: org,
  });
});

const listOrganizations = asyncHandler(async (req, res) => {
  const result = await organizationsService.listOrganizations(req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getOrganizationById = asyncHandler(async (req, res) => {
  const org = await organizationsService.getOrganizationById(req.params.id);
  sendSuccess(res, {
    statusCode: 200,
    data: org,
  });
});

const updateOrganization = asyncHandler(async (req, res) => {
  const org = await organizationsService.updateOrganization(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: org,
  });
});

const updateOrganizationStatus = asyncHandler(async (req, res) => {
  const org = await organizationsService.updateOrganizationStatus(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: org,
  });
});

const deleteOrganization = asyncHandler(async (req, res) => {
  const result = await organizationsService.deleteOrganization(req.params.id, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganizationById,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
};
