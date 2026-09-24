const registrationsService = require('./registrations.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const registerForEvent = asyncHandler(async (req, res) => {
  const result = await registrationsService.registerForEvent(
    req.params.eventId,
    req.user._id,
    req.body
  );
  sendSuccess(res, {
    statusCode: 201,
    data: result.registration,
    meta: result.warnings ? { warnings: result.warnings } : undefined,
  });
});

const cancelRegistration = asyncHandler(async (req, res) => {
  const result = await registrationsService.cancelRegistration(
    req.params.eventId,
    req.params.id,
    req.user
  );
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const registration = await registrationsService.updateRegistrationStatus(
    req.params.eventId,
    req.params.id,
    req.body.status,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: registration,
  });
});

const pickSessions = asyncHandler(async (req, res) => {
  const result = await registrationsService.pickSessions(
    req.params.eventId,
    req.user._id,
    req.body.sessionIds
  );
  sendSuccess(res, {
    statusCode: 200,
    data: result.registration,
    meta: result.warnings ? { warnings: result.warnings } : undefined,
  });
});

const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await registrationsService.getMyRegistrations(req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: registrations,
  });
});

const listRegistrations = asyncHandler(async (req, res) => {
  const result = await registrationsService.listRegistrations(req.params.eventId, req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getRegistrationById = asyncHandler(async (req, res) => {
  const registration = await registrationsService.getRegistrationById(
    req.params.eventId,
    req.params.id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: registration,
  });
});

module.exports = {
  registerForEvent,
  cancelRegistration,
  updateRegistrationStatus,
  pickSessions,
  getMyRegistrations,
  listRegistrations,
  getRegistrationById,
};
